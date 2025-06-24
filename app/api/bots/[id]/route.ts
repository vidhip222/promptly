import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .select(`
        *,
        documents(*),
        messages(count)
      `)
      .eq("id", params.id)
      .single()

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Get bot error:", error)
    return NextResponse.json({ error: "Failed to get bot" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()

    const { data: bot, error } = await supabaseAdmin.from("bots").update(updates).eq("id", params.id).select().single()

    if (error) {
      console.error("Update bot error:", error)
      return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Update bot error:", error)
    return NextResponse.json({ error: "Failed to update bot" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`🗑️ Deleting bot ${params.id}...`)

    // Get bot info first
    const { data: bot, error: getBotError } = await supabaseAdmin
      .from("bots")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (getBotError || !bot) {
      console.error("❌ Bot not found:", getBotError)
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    // Delete documents from storage first
    console.log("🗑️ Deleting documents from storage...")
    const { data: documents } = await supabaseAdmin.from("documents").select("file_path").eq("bot_id", params.id)

    if (documents && documents.length > 0) {
      const filePaths = documents.map((doc) => doc.file_path)
      const { error: storageError } = await supabaseAdmin.storage.from("documents").remove(filePaths)

      if (storageError) {
        console.error("⚠️ Storage deletion error:", storageError)
      } else {
        console.log(`✅ Deleted ${filePaths.length} files from storage`)
      }
    }

    // Delete related documents from database
    console.log("🗑️ Deleting documents from database...")
    const { error: docsError } = await supabaseAdmin.from("documents").delete().eq("bot_id", params.id)

    if (docsError) {
      console.error("❌ Failed to delete documents:", docsError)
    }

    // Delete related messages
    console.log("🗑️ Deleting messages...")
    const { error: messagesError } = await supabaseAdmin.from("messages").delete().eq("bot_id", params.id)

    if (messagesError) {
      console.error("❌ Failed to delete messages:", messagesError)
    }

    // Delete the bot
    console.log("🗑️ Deleting bot...")
    const { error: botError } = await supabaseAdmin.from("bots").delete().eq("id", params.id)

    if (botError) {
      console.error("❌ Failed to delete bot:", botError)
      return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
    }

    console.log(`✅ Bot ${params.id} deleted successfully`)
    return NextResponse.json({ success: true, message: "Bot deleted successfully" })
  } catch (error) {
    console.error("❌ Delete bot error:", error)
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}
