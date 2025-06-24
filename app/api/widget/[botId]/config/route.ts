import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { botId: string } }) {
  try {
    const { data: bot, error } = await supabaseAdmin
      .from("bots")
      .select("id, name, description, personality, instructions")
      .eq("id", params.botId)
      .eq("status", "active")
      .single()

    if (error || !bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    const config = {
      id: bot.id,
      name: bot.name,
      description: bot.description || "AI Assistant",
      personality: bot.personality || "helpful",
      primaryColor: "#3B82F6", // Default blue, could be customizable
      greeting: `Hello! I'm ${bot.name}. How can I help you today?`,
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Widget config error:", error)
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}
