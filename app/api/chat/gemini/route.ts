import { type NextRequest, NextResponse } from "next/server"
import { generateEmbedding, generateChatResponse } from "@/lib/gemini"
import { queryVectors } from "@/lib/pinecone"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId } = await request.json()

    // Get bot configuration from Supabase
    const { data: bot, error: botError } = await supabaseAdmin
      .from("bots")
      .select("*")
      .eq("id", botId)
      .eq("user_id", userId)
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(message)

    // Search for relevant documents in Pinecone
    const searchResults = await queryVectors(queryEmbedding, { botId, userId }, 5)

    // Build context from search results
    let context = ""
    const sources: string[] = []

    if (searchResults.length > 0) {
      context = "Based on the following documents:\n\n"
      searchResults.forEach((result, index) => {
        if (result.metadata) {
          context += `Document ${index + 1} (${result.metadata.fileName}): "${result.metadata.text}"\n\n`
          if (!sources.includes(result.metadata.fileName)) {
            sources.push(result.metadata.fileName)
          }
        }
      })
    }

    // Get recent chat history from Supabase
    const { data: historyData } = await supabaseAdmin
      .from("messages")
      .select("content, role")
      .eq("bot_id", botId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    const chatHistory = (historyData || []).reverse().map((row) => ({
      role: row.role,
      content: row.content,
    }))

    // Add current message
    chatHistory.push({ role: "user", content: message })

    // Generate response using Gemini 2.0 Flash
    const persona = `${bot.name} - ${bot.personality}. ${bot.instructions}`
    const response = await generateChatResponse(chatHistory, context, persona)

    // Store messages in Supabase
    await supabaseAdmin.from("messages").insert([
      {
        bot_id: botId,
        user_id: userId,
        content: message,
        role: "user",
        metadata: { sources: [] },
      },
      {
        bot_id: botId,
        user_id: userId,
        content: response,
        role: "assistant",
        metadata: { sources },
      },
    ])

    return NextResponse.json({
      response,
      sources,
      context: searchResults.length > 0,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
