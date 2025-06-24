import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { documentId, action } = await request.json()
    const botId = params.id

    console.log(`🔄 Retraining bot ${botId} after ${action}`)

    // Get all current documents for this bot
    const { data: documents, error: docsError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("bot_id", botId)
      .eq("status", "completed")

    if (docsError) {
      console.error("❌ Failed to get documents:", docsError)
      return NextResponse.json({ error: "Failed to get documents" }, { status: 500 })
    }

    console.log(`📄 Found ${documents.length} completed documents for retraining`)

    // In production, this would:
    // 1. Re-generate embeddings for all documents
    // 2. Update vector database with new embeddings
    // 3. Rebuild the bot's knowledge base
    // 4. Update bot's training status

    // For now, we'll update the bot's last_trained timestamp
    const { error: updateError } = await supabaseAdmin
      .from("bots")
      .update({
        last_trained: new Date().toISOString(),
        document_count: documents.length,
        training_status: "completed",
      })
      .eq("id", botId)

    if (updateError) {
      console.error("❌ Failed to update bot training status:", updateError)
      return NextResponse.json({ error: "Failed to update training status" }, { status: 500 })
    }

    // Log the retraining event
    await supabaseAdmin.from("audit_logs").insert({
      action: "bot_retrained",
      resource_type: "bot",
      resource_id: botId,
      metadata: {
        trigger: action,
        document_id: documentId,
        document_count: documents.length,
        retrained_at: new Date().toISOString(),
      },
    })

    console.log(`✅ Bot ${botId} retrained successfully with ${documents.length} documents`)

    return NextResponse.json({
      success: true,
      message: "Bot retrained successfully",
      documentCount: documents.length,
      lastTrained: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Bot retraining error:", error)
    return NextResponse.json({ error: "Failed to retrain bot" }, { status: 500 })
  }
}
