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

    console.log("Upload request:", { fileName: file?.name, botId, userId })

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
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max size is 10MB" }, { status: 400 })
    }

    const documentId = uuidv4()
    const fileName = `${documentId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const filePath = `${userId}/${botId}/${fileName}`

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("File buffer size:", buffer.length)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log("Upload successful:", uploadData)

    // Store document metadata in Supabase
    const { data: docData, error: dbError } = await supabaseAdmin
      .from("documents")
      .insert({
        id: documentId,
        bot_id: botId,
        user_id: userId,
        name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        status: "processing",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: `Failed to save document metadata: ${dbError.message}` }, { status: 500 })
    }

    console.log("Document metadata saved:", docData)

    // Process document asynchronously
    processDocumentAsync(documentId, filePath, file.type, botId, userId, buffer)

    return NextResponse.json({
      success: true,
      documentId,
      document: docData,
      message: "Document uploaded successfully and processing started",
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
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
    console.log(`Processing document ${documentId}...`)

    // Parse document
    const text = await parseDocument(buffer, fileType)
    console.log(`Extracted text length: ${text.length}`)

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in document")
    }

    // Chunk text
    const chunks = chunkText(text)
    console.log(`Generated ${chunks.length} chunks`)

    if (chunks.length === 0) {
      throw new Error("No chunks generated from document")
    }

    // Generate embeddings using Gemini and store in Pinecone
    let vectorsCreated = 0
    try {
      const vectors = []

      for (let i = 0; i < Math.min(chunks.length, 10); i++) {
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
        }
      }

      if (vectors.length > 0) {
        await upsertVectors(vectors)
        vectorsCreated = vectors.length
      }
    } catch (vectorError) {
      console.error("Vector processing error:", vectorError)
    }

    // Update document status in Supabase
    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        chunks_count: chunks.length,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    console.log(`Document ${documentId} processed successfully with ${vectorsCreated} vectors`)
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error)

    // Update document status to failed in Supabase
    await supabaseAdmin
      .from("documents")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
  }
}
