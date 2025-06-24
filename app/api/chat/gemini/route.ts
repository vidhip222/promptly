import { type NextRequest, NextResponse } from "next/server"
import { generateEmbedding, generateChatResponse } from "@/lib/gemini"
import { queryVectors } from "@/lib/pinecone"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId } = await request.json()

    // Get bot configuration
    const botResult = await pool.query("SELECT * FROM bots WHERE id = $1 AND user_id = $2", [botId, userId])

    if (botResult.rows.length === 0) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    const bot = botResult.rows[0]

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

    // Get recent chat history
    const historyResult = await pool.query(
      `SELECT content, role FROM messages 
       WHERE bot_id = $1 AND user_id = $2 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [botId, userId],
    )

    const chatHistory = historyResult.rows.reverse().map((row) => ({
      role: row.role,
      content: row.content,
    }))

    // Add current message
    chatHistory.push({ role: "user", content: message })

    // Generate response using Gemini
    const persona = `${bot.name} - ${bot.personality}. ${bot.instructions}`
    const response = await generateChatResponse(chatHistory, context, persona)

    // Store messages in database
    await pool.query(
      "INSERT INTO messages (id, bot_id, user_id, content, role, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
      [crypto.randomUUID(), botId, userId, message, "user", JSON.stringify({ sources: [] })],
    )

    await pool.query(
      "INSERT INTO messages (id, bot_id, user_id, content, role, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
      [crypto.randomUUID(), botId, userId, response, "assistant", JSON.stringify({ sources })],
    )

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
