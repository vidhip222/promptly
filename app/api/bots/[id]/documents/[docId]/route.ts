import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; docId: string } }) {
  try {
    console.log(`🗑️ Deleting document ${params.docId} from bot ${params.id}`)

    // Get document info first
    const { data: document, error: getDocError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("id", params.docId)
      .eq("bot_id", params.id)
      .single()

    if (getDocError || !document) {
      console.error("❌ Document not found:", getDocError)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    console.log("📄 Found document:", document.name, "at path:", document.file_path)

    // 1. Delete document from Supabase Storage
    if (document.file_path) {
      console.log("🗑️ Deleting from storage:", document.file_path)
      const { error: storageError } = await supabaseAdmin.storage.from("documents").remove([document.file_path])

      if (storageError) {
        console.error("⚠️ Storage deletion error:", storageError)
      } else {
        console.log("✅ Deleted from storage successfully")
      }
    }

    // 2. Delete embeddings from vector database (Pinecone)
    try {
      console.log("🧠 Deleting embeddings for document:", params.docId)
      // In production, you would delete from Pinecone here
      // await pinecone.index('promptly-docs').deleteMany({ filter: { document_id: params.docId } })
      console.log("✅ Embeddings deleted (simulated)")
    } catch (embeddingError) {
      console.error("⚠️ Embedding deletion error:", embeddingError)
    }

    // 3. Delete document from database
    console.log("🗑️ Deleting from database...")
    const { error: deleteError } = await supabaseAdmin.from("documents").delete().eq("id", params.docId)

    if (deleteError) {
      console.error("❌ Database deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete document from database" }, { status: 500 })
    }

    // Trigger bot retraining after document deletion
    try {
      console.log("🔄 Triggering bot retraining after deletion...")
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bots/${params.id}/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: params.docId, action: "document_removed" }),
      })
      console.log("✅ Bot retraining triggered after deletion")
    } catch (retrainError) {
      console.error("⚠️ Failed to trigger retraining:", retrainError)
    }

    // 4. Log deletion for audit trail
    await supabaseAdmin.from("audit_logs").insert({
      action: "document_deleted",
      resource_type: "document",
      resource_id: params.docId,
      bot_id: params.id,
      user_id: document.user_id,
      metadata: {
        document_name: document.name,
        file_path: document.file_path,
        file_size: document.file_size,
        deleted_at: new Date().toISOString(),
      },
    })

    console.log("✅ Document deletion completed with audit log")

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
      deletedDocument: {
        id: document.id,
        name: document.name,
      },
    })
  } catch (error) {
    console.error("❌ Delete document error:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
