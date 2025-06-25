import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { parseDocument } from "@/lib/document-parser" // Import the parser

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const botId = formData.get("botId") as string | null
    const userId = formData.get("userId") as string | null

    console.log("--- Document Upload Request Received ---")
    console.log("File Name:", file?.name)
    console.log("Bot ID:", botId)
    console.log("User ID:", userId)

    if (!file || !botId || !userId) {
      console.error("❌ Missing file, botId, or userId")
      return NextResponse.json({ error: "Missing file, botId, or userId" }, { status: 400 })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filePath = `${userId}/${botId}/${file.name}`
    const fileType = file.type
    const fileSize = file.size

    // Validate file type and size
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "text/plain",
      "text/csv",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ]
    const maxFileSize = 10 * 1024 * 1024 // 10 MB

    if (!allowedTypes.includes(fileType)) {
      console.error(`❌ Unsupported file type: ${fileType}`)
      return NextResponse.json({ error: `Unsupported file type: ${fileType}` }, { status: 400 })
    }

    if (fileSize > maxFileSize) {
      console.error(`❌ File size too large: ${fileSize} bytes`)
      return NextResponse.json({ error: `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit` }, { status: 400 })
    }

    // 1. Upload file to Supabase Storage
    console.log(`⬆️ Uploading file to Supabase Storage: ${filePath}`)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(filePath, fileBuffer, {
        contentType: fileType,
        upsert: true,
      })

    if (uploadError) {
      console.error("❌ Supabase Storage upload error:", uploadError.message)
      return NextResponse.json({ error: "Failed to upload file to storage: " + uploadError.message }, { status: 500 })
    }
    console.log("✅ File uploaded to Supabase Storage.")

    let extractedContent = ""
    // Only parse text-based documents for content extraction
    if (
      fileType === "application/pdf" ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileType === "text/plain" ||
      fileType === "text/csv"
    ) {
      console.log(`📝 Parsing text content for ${fileType}...`)
      extractedContent = await parseDocument(filePath, fileType, fileBuffer)
      console.log(`✅ Text content parsed. Length: ${extractedContent.length}`)
    } else {
      console.log(`🖼️ File type ${fileType} is an image. No text content extraction needed.`)
    }

    // 2. Insert → Update fallback (works without a UNIQUE constraint)
    console.log("💾 Saving document metadata …")
    let { data: documentData, error: documentError } = await supabaseAdmin
      .from("documents")
      .insert({
        bot_id: botId,
        user_id: userId,
        name: file.name,
        file_path: uploadData.path,
        file_type: fileType,
        file_size: fileSize,
        status: "completed",
        content: extractedContent,
      })
      .select()
      .single()

    if (documentError?.code === "23505" /* duplicate key */) {
      console.warn("ℹ️ Duplicate file_path – updating existing record …")
      const updateRes = await supabaseAdmin
        .from("documents")
        .update({
          name: file.name,
          file_type: fileType,
          file_size: fileSize,
          status: "completed",
          content: extractedContent,
        })
        .eq("file_path", uploadData.path)
        .select()
        .single()
      documentData = updateRes.data
      documentError = updateRes.error ?? undefined
    }

    if (documentError) {
      console.error("❌ Supabase database document save error:", documentError.message)
      return NextResponse.json({ error: "Failed to save document metadata: " + documentError.message }, { status: 500 })
    }
    console.log("✅ Document metadata saved.")

    // If this is the first document for a draft bot, activate the bot
    const { data: botData, error: botError } = await supabaseAdmin
      .from("bots")
      .select("status")
      .eq("id", botId)
      .single()
    if (botData && botData.status === "draft") {
      const { error: updateBotError } = await supabaseAdmin.from("bots").update({ status: "active" }).eq("id", botId)
      if (updateBotError) {
        console.error("❌ Failed to activate bot after first document upload:", updateBotError.message)
      } else {
        console.log("✅ Bot status updated from 'draft' to 'active'.")
      }
    }

    console.log("--- Document Upload Request Completed ---")
    return NextResponse.json({ message: "Document uploaded and processed successfully", document: documentData })
  } catch (error: any) {
    console.error("❌ Document upload failed (top-level catch):", error.message)
    return NextResponse.json({ error: "Document upload failed: " + error.message }, { status: 500 })
  }
}
