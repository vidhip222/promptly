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
    // Delete related documents first
    await supabaseAdmin.from("documents").delete().eq("bot_id", params.id)

    // Delete related messages
    await supabaseAdmin.from("messages").delete().eq("bot_id", params.id)

    // Delete the bot
    const { error } = await supabaseAdmin.from("bots").delete().eq("id", params.id)

    if (error) {
      console.error("Delete bot error:", error)
      return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete bot error:", error)
    return NextResponse.json({ error: "Failed to delete bot" }, { status: 500 })
  }
}
