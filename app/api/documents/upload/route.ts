import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateEmbedding } from "@/lib/gemini"
import { upsertVectors } from "@/lib/pinecone"
import { parseDocument, chunkText } from "@/lib/document-parser"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const botId = formData.get("botId") as string
    const userId = formData.get("userId") as string

    if (!file || !botId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/csv",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max size is 10MB" }, { status: 400 })
    }

    const documentId = uuidv4()
    const fileName = `${documentId}-${file.name}`
    const filePath = `documents/${userId}/${botId}/${fileName}`

    // Upload file to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage.from("documents").upload(filePath, buffer, {
      contentType: file.type,
      metadata: {
        userId,
        botId,
        documentId,
        originalName: file.name,
      },
    })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    // Store document metadata in database
    const { error: dbError } = await supabaseAdmin.from("documents").insert({
      id: documentId,
      bot_id: botId,
      user_id: userId,
      name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      status: "processing",
    })

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Failed to save document metadata" }, { status: 500 })
    }

    // Process document asynchronously
    processDocumentAsync(documentId, filePath, file.type, botId, userId, buffer)

    return NextResponse.json({
      success: true,
      documentId,
      message: "Document uploaded successfully and processing started",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

async function processDocumentAsync(
  documentId: string,
  filePath: string,
  fileType: string,
  botId: string,
  userId: string,
  buffer: Buffer,
) {
  try {
    // Parse document
    const text = await parseDocument(buffer, fileType)

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in document")
    }

    // Chunk text
    const chunks = chunkText(text)

    if (chunks.length === 0) {
      throw new Error("No chunks generated from document")
    }

    // Generate embeddings and store in Pinecone
    const vectors = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      try {
        const embedding = await generateEmbedding(chunk)

        vectors.push({
          id: `${documentId}_chunk_${i}`,
          values: embedding,
          metadata: {
            documentId,
            botId,
            userId,
            fileName: filePath.split("/").pop()!,
            chunkIndex: i,
            text: chunk,
          },
        })
      } catch (embeddingError) {
        console.error(`Failed to generate embedding for chunk ${i}:`, embeddingError)
        // Continue with other chunks
      }
    }

    if (vectors.length > 0) {
      await upsertVectors(vectors)
    }

    // Update document status
    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        chunks_count: vectors.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    console.log(`Document ${documentId} processed successfully with ${vectors.length} chunks`)
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error)

    // Update document status to failed
    await supabaseAdmin
      .from("documents")
      .update({
        status: "failed",
        error_message: error.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
  }
}
