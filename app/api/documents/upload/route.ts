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

    // Chunk text
    const chunks = chunkText(text)

    // Generate embeddings and store in Pinecone
    const vectors = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
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
    }

    await upsertVectors(vectors)

    // Update document status
    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        chunks_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    console.log(`Document ${documentId} processed successfully`)
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error)

    // Update document status to failed
    await supabaseAdmin
      .from("documents")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
  }
}
