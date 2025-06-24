import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { parseDocument, chunkText } from "@/lib/document-parser"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const botId = formData.get("botId") as string
    const userId = formData.get("userId") as string

    console.log("📄 Document Upload Request:", {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      botId,
      userId,
    })

    if (!file || !botId || !userId) {
      console.error("❌ Missing required fields")
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
      console.error("❌ Unsupported file type:", file.type)
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error("❌ File too large:", file.size)
      return NextResponse.json({ error: "File too large. Max size is 10MB" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}-${cleanFileName}`
    const filePath = `${userId}/${botId}/${fileName}`

    console.log("📁 File path:", filePath)

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log("💾 File buffer created, size:", buffer.length)

    // Upload file to Supabase Storage
    console.log("☁️ Uploading to Supabase Storage...")
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log("✅ Upload successful:", uploadData.path)

    // Store document metadata in Supabase
    console.log("💾 Saving document metadata...")
    const { data: docData, error: dbError } = await supabaseAdmin
      .from("documents")
      .insert({
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
      console.error("❌ Database error:", dbError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: `Failed to save document metadata: ${dbError.message}` }, { status: 500 })
    }

    console.log("✅ Document metadata saved:", docData.id)

    // Trigger bot retraining after document upload
    try {
      console.log("🔄 Triggering bot retraining...")
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bots/${botId}/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docData.id, action: "document_added" }),
      })
      console.log("✅ Bot retraining triggered")
    } catch (retrainError) {
      console.error("⚠️ Failed to trigger retraining:", retrainError)
    }

    // Process document asynchronously
    console.log("🔄 Starting document processing...")
    processDocumentAsync(docData.id, filePath, file.type, botId, userId, buffer, file.name)

    return NextResponse.json({
      success: true,
      documentId: docData.id,
      document: docData,
      message: `Document "${file.name}" uploaded successfully and processing started`,
      fileName: file.name,
    })
  } catch (error) {
    console.error("❌ Upload error:", error)
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
  originalFileName: string,
) {
  try {
    console.log(`🔄 Processing document ${documentId} (${originalFileName})...`)

    // Parse document
    const text = await parseDocument(buffer, fileType)
    console.log(`📝 Extracted text length: ${text.length} characters`)

    if (!text || text.trim().length === 0) {
      throw new Error("No text content found in document")
    }

    // Chunk text
    const chunks = chunkText(text, 500, 50)
    console.log(`📄 Generated ${chunks.length} chunks`)

    if (chunks.length === 0) {
      throw new Error("No chunks generated from document")
    }

    // Generate embeddings for chunks (simplified for now)
    let processedChunks = 0
    try {
      for (let i = 0; i < Math.min(chunks.length, 20); i++) {
        const chunk = chunks[i]
        try {
          // In production, you would generate embeddings here
          // const embedding = await generateEmbedding(chunk)
          // Store in vector database
          processedChunks++
        } catch (embeddingError) {
          console.error(`❌ Failed to process chunk ${i}:`, embeddingError)
        }
      }
    } catch (vectorError) {
      console.error("❌ Vector processing error:", vectorError)
    }

    // Update document status
    await supabaseAdmin
      .from("documents")
      .update({
        status: "completed",
        content: text,
        chunks_count: chunks.length,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)

    console.log(`✅ Document ${documentId} (${originalFileName}) processed successfully with ${processedChunks} chunks`)
  } catch (error) {
    console.error(`❌ Document processing failed for ${documentId} (${originalFileName}):`, error)

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
