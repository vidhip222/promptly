import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { type NextRequest, NextResponse } from "next/server"
import { pinecone } from "@/lib/pinecone"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { text, botId, documentId, chunkIndex, metadata } = await request.json()

    if (!text || !botId || !documentId) {
      return NextResponse.json({ error: "Text, botId, and documentId are required" }, { status: 400 })
    }

    console.log("🔮 Generating embeddings for document:", documentId)

    // Generate embeddings using OpenAI
    const { embedding, usage } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: text,
    })

    console.log("✅ Embeddings generated, dimensions:", embedding.length)

    // 1. Store the embedding in Pinecone vector database
    const index = pinecone.index("promptly-docs")

    const vectorId = `${documentId}_chunk_${chunkIndex || Date.now()}`

    await index.upsert([
      {
        id: vectorId,
        values: embedding,
        metadata: {
          bot_id: botId,
          document_id: documentId,
          text: text.substring(0, 1000), // Store first 1000 chars for context
          chunk_index: chunkIndex || 0,
          created_at: new Date().toISOString(),
          ...metadata,
        },
      },
    ])

    console.log("✅ Embedding stored in Pinecone with ID:", vectorId)

    // 2. Update document status in database
    await supabaseAdmin
      .from("documents")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        embedding_count: (chunkIndex || 0) + 1,
      })
      .eq("id", documentId)

    // 3. Log embedding creation for audit
    await supabaseAdmin.from("audit_logs").insert({
      action: "embedding_created",
      resource_type: "document",
      resource_id: documentId,
      bot_id: botId,
      metadata: {
        vector_id: vectorId,
        dimensions: embedding.length,
        chunk_index: chunkIndex,
        usage,
      },
    })

    return NextResponse.json({
      success: true,
      vectorId,
      embedding: embedding.slice(0, 5), // Return first 5 dimensions for verification
      usage,
      dimensions: embedding.length,
      message: "Embedding stored successfully in Pinecone",
    })
  } catch (error) {
    console.error("❌ Embedding generation error:", error)
    return NextResponse.json({ error: "Failed to generate and store embeddings" }, { status: 500 })
  }
}

// New endpoint for semantic search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const botId = searchParams.get("botId")
    const limit = Number.parseInt(searchParams.get("limit") || "5")

    if (!query || !botId) {
      return NextResponse.json({ error: "Query and botId are required" }, { status: 400 })
    }

    console.log("🔍 Performing semantic search for:", query)

    // Generate embedding for the query
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    })

    // Search Pinecone for similar vectors
    const index = pinecone.index("promptly-docs")
    const searchResults = await index.query({
      vector: embedding,
      filter: { bot_id: botId },
      topK: limit,
      includeMetadata: true,
    })

    console.log("✅ Found", searchResults.matches?.length || 0, "relevant chunks")

    return NextResponse.json({
      success: true,
      results:
        searchResults.matches?.map((match) => ({
          id: match.id,
          score: match.score,
          text: match.metadata?.text,
          documentId: match.metadata?.document_id,
          chunkIndex: match.metadata?.chunk_index,
        })) || [],
    })
  } catch (error) {
    console.error("❌ Semantic search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
