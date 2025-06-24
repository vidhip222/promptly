import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's bots from database
    const { data: bots, error } = await supabaseAdmin
      .from("bots")
      .select(`
        *,
        documents:documents(count),
        messages:messages(count)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get bots error:", error)
      return NextResponse.json({ bots: [] }) // Return empty array instead of error for better UX
    }

    // Transform the data to include counts
    const transformedBots = (bots || []).map((bot) => ({
      ...bot,
      documentsCount: bot.documents?.[0]?.count || 0,
      messagesCount: bot.messages?.[0]?.count || 0,
    }))

    return NextResponse.json({ bots: transformedBots })
  } catch (error) {
    console.error("Get bots error:", error)
    return NextResponse.json({ bots: [] }) // Return empty array for better UX
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, department, personality, instructions, tone, goal, template_id, status, userId } =
      await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .insert({
        user_id: userId,
        name,
        description,
        department,
        personality,
        instructions,
        tone,
        goal,
        template_id,
        status: status || "draft",
      })
      .select()
      .single()

    if (error) {
      console.error("Create bot error:", error)
      return NextResponse.json({ error: "Failed to create bot" }, { status: 500 })
    }

    return NextResponse.json({ bot })
  } catch (error) {
    console.error("Create bot error:", error)
    return NextResponse.json({ error: "Failed to create bot" }, { status: 500 })
  }
}
