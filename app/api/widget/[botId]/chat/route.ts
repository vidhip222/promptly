import { type NextRequest, NextResponse } from "next/server"
import { generateEmbedding, generateChatResponseSync } from "@/lib/gemini"
import { queryVectors } from "@/lib/pinecone"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { botId: string } }) {
  try {
    const { message, history } = await request.json()

    // Get bot configuration
    const { data: bot, error: botError } = await supabaseAdmin
      .from("bots")
      .select("*")
      .eq("id", params.botId)
      .eq("status", "active")
      .single()

    if (botError || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Generate embedding for user query
    const queryEmbedding = await generateEmbedding(message)

    // Search for relevant documents in Pinecone
    const searchResults = await queryVectors(queryEmbedding, { botId: params.botId }, 3)

    // Build context from search results
    let context = ""
    const sources: string[] = []

    if (searchResults.length > 0) {
      context = "Based on the following company documents:\n\n"
      searchResults.forEach((result, index) => {
        if (result.metadata) {
          context += `Document ${index + 1} (${result.metadata.fileName}): "${result.metadata.text}"\n\n`
          if (!sources.includes(result.metadata.fileName)) {
            sources.push(result.metadata.fileName)
          }
        }
      })
    }

    // Build chat history
    const chatHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add current message
    chatHistory.push({ role: "user", content: message })

    // Generate response using Gemini
    const botConfig = {
      name: bot.name,
      personality: bot.personality || "professional and helpful",
      instructions: bot.instructions || "Be helpful and provide accurate information",
    }

    const response = await generateChatResponseSync(chatHistory, context, botConfig)

    return NextResponse.json({
      response,
      sources,
      context: searchResults.length > 0,
    })
  } catch (error) {
    console.error("Widget chat error:", error)
    return NextResponse.json({ error: "Chat failed" }, { status: 500 })
  }
}
