import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { generateEmbedding, generateChatResponseSync } from "@/lib/gemini"
import { queryVectors } from "@/lib/pinecone"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle URL verification
    if (body.type === "url_verification") {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle events
    if (body.type === "event_callback") {
      const event = body.event

      // Only respond to messages that mention the bot
      if (event.type === "app_mention" || (event.type === "message" && event.channel_type === "im")) {
        await handleSlackMessage(event, body.team_id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Slack events error:", error)
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 })
  }
}

async function handleSlackMessage(event: any, teamId: string) {
  try {
    // Get Slack integration
    const { data: integration } = await supabaseAdmin
      .from("slack_integrations")
      .select("*, bots(*)")
      .eq("workspace_id", teamId)
      .eq("status", "active")
      .single()

    if (!integration) {
      console.log("No active integration found for team:", teamId)
      return
    }

    const bot = integration.bots
    const message = event.text.replace(/<@[^>]+>/g, "").trim() // Remove bot mention

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(message)

    // Search for relevant documents
    const searchResults = await queryVectors(queryEmbedding, { botId: bot.id }, 3)

    // Build context
    let context = ""
    if (searchResults.length > 0) {
      context = "Based on company documents:\n\n"
      searchResults.forEach((result, index) => {
        if (result.metadata) {
          context += `${index + 1}. ${result.metadata.text}\n\n`
        }
      })
    }

    // Generate response
    const botConfig = {
      name: bot.name,
      personality: bot.personality || "professional and helpful",
      instructions: bot.instructions || "Be helpful and provide accurate information",
    }

    const response = await generateChatResponseSync([{ role: "user", content: message }], context, botConfig)

    // Send response to Slack
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.bot_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: event.channel,
        text: response,
        thread_ts: event.ts, // Reply in thread if it's a threaded message
      }),
    })

    // Store conversation in database
    await supabaseAdmin.from("messages").insert([
      {
        bot_id: bot.id,
        user_id: integration.user_id,
        content: message,
        role: "user",
        metadata: { platform: "slack", channel: event.channel },
      },
      {
        bot_id: bot.id,
        user_id: integration.user_id,
        content: response,
        role: "assistant",
        metadata: { platform: "slack", channel: event.channel },
      },
    ])
  } catch (error) {
    console.error("Slack message handling error:", error)
  }
}
