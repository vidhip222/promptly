import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, botId } = await request.json()

    if (!text || !botId) {
      return NextResponse.json({ error: "Text and botId are required" }, { status: 400 })
    }

    // Generate embeddings using OpenAI
    const { embedding, usage } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text,
    })

    // In a real implementation, you would:
    // 1. Store the embedding in a vector database (Pinecone)
    // 2. Associate it with the bot and source document
    // 3. Enable semantic search capabilities

    return NextResponse.json({
      success: true,
      embedding,
      usage,
      dimensions: embedding.length,
    })
  } catch (error) {
    console.error("Embedding generation error:", error)
    return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 })
  }
}
