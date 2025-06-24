import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { deleteVectors } from "@/lib/pinecone"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .select(`
        *,
        documents(*),
        messages(count)
      `)
      .eq("id", params.id)
      .eq("user_id", userId)
      .single()

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Get bot error:", error)
    return NextResponse.json({ error: "Failed to fetch bot" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const { userId, ...botUpdates } = updates

    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .update({
        ...botUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single()

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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Delete vectors from Pinecone
    await deleteVectors({ botId: params.id })

    // Delete bot documents from storage
    const { data: documents } = await supabaseAdmin.from("documents").select("file_path").eq("bot_id", params.id)

    if (documents) {
      for (const doc of documents) {
        await supabaseAdmin.storage.from("documents").remove([doc.file_path])
      }
    }

    // Delete bot from database (cascades to documents and messages)
    const { error } = await supabaseAdmin.from("bots").delete().eq("id", params.id).eq("user_id", userId)

    if (error) {
      console.error("Delete bot error:", error)
      return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Bot deleted successfully" })
  } catch (error) {
    console.error("Delete bot error:", error)
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}
