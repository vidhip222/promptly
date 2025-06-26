import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest, { params }: { params: { botId: string } }) {
  try {
    const { botId } = params
    const body = await request.json()

    console.log("📨 Slack webhook received for bot:", botId)

    // Handle Slack URL verification challenge
    if (body.challenge) {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle Slack events
    if (body.event) {
      const { event } = body

      // Only respond to messages that mention the bot or are in DM
      if (event.type === "message" && !event.bot_id && event.text) {
        console.log("💬 Processing Slack message:", event.text)

        // Get bot configuration
        const { data: bot } = await supabaseAdmin.from("bots").select("*").eq("id", botId).single()

        if (!bot) {
          console.error("❌ Bot not found:", botId)
          return NextResponse.json({ success: false })
        }

        // Generate response using the chat API
        const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: event.text,
            botId: botId,
            userId: event.user,
            isGuest: false,
          }),
        })

        const chatData = await chatResponse.json()

        if (chatData.response) {
          // Get Slack integration details
          const { data: integration } = await supabaseAdmin
            .from("slack_integrations")
            .select("access_token")
            .eq("bot_id", botId)
            .single()

          if (integration?.access_token) {
            // Send response back to Slack
            await fetch("https://slack.com/api/chat.postMessage", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${integration.access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                channel: event.channel,
                text: chatData.response,
                thread_ts: event.ts, // Reply in thread
              }),
            })

            console.log("✅ Response sent to Slack")
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Slack webhook error:", error)
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
  }
}
