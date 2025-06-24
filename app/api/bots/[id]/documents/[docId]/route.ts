import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase"
import { pinecone } from "@/lib/pinecone"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; docId: string } }) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: botId, docId } = params

    // Get document info first
    const { data: document, error: docError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", docId)
      .eq("bot_id", botId)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log("🗑️ Starting document deletion process for:", document.name)

    // 1. Delete document from Supabase Storage
    if (document.file_path) {
      console.log("📁 Deleting file from storage:", document.file_path)
      const { error: storageError } = await supabaseAdmin.storage.from("documents").remove([document.file_path])

      if (storageError) {
        console.error("❌ Storage deletion failed:", storageError)
      } else {
        console.log("✅ File deleted from storage successfully")
      }
    }

    // 2. Delete embeddings from Pinecone vector database
    try {
      console.log("🔍 Deleting embeddings from Pinecone...")
      const index = pinecone.index("promptly-docs")

      // Delete all vectors for this document
      await index.deleteMany({
        filter: {
          document_id: docId,
          bot_id: botId,
        },
      })
      console.log("✅ Embeddings deleted from Pinecone")
    } catch (pineconeError) {
      console.error("❌ Pinecone deletion failed:", pineconeError)
    }

    // 3. Delete document record from database
    const { error: deleteError } = await supabaseAdmin.from("documents").delete().eq("id", docId).eq("bot_id", botId)

    if (deleteError) {
      console.error("❌ Database deletion failed:", deleteError)
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
    }

    // 4. Log deletion for audit trail
    await supabaseAdmin.from("audit_logs").insert({
      action: "document_deleted",
      resource_type: "document",
      resource_id: docId,
      bot_id: botId,
      metadata: {
        document_name: document.name,
        file_path: document.file_path,
        deleted_at: new Date().toISOString(),
      },
    })

    console.log("✅ Document deletion completed successfully")

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      deletedDocument: {
        id: docId,
        name: document.name,
      },
    })
  } catch (error) {
    console.error("❌ Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
