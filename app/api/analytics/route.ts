import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get analytics data from database
    const [botsResult, messagesResult, documentsResult] = await Promise.all([
      supabaseAdmin.from("bots").select("id, name").eq("user_id", userId),
      supabaseAdmin.from("messages").select("id, bot_id, created_at").eq("user_id", userId),
      supabaseAdmin.from("documents").select("id, bot_id, created_at").eq("user_id", userId),
    ])

    const bots = botsResult.data || []
    const messages = messagesResult.data || []
    const documents = documentsResult.data || []

    // Calculate top bots
    const botStats = bots.map((bot) => {
      const botMessages = messages.filter((msg) => msg.bot_id === bot.id)
      return {
        id: bot.id,
        name: bot.name,
        messages: botMessages.length,
        satisfaction: 4.5 + Math.random() * 0.5, // Mock satisfaction score
      }
    })

    const topBots = botStats.sort((a, b) => b.messages - a.messages).slice(0, 5)

    // Generate recent activity
    const recentActivity = [
      ...messages.slice(-3).map((msg) => ({
        id: msg.id,
        type: "message" as const,
        description: "New message received",
        timestamp: msg.created_at,
      })),
      ...documents.slice(-2).map((doc) => ({
        id: doc.id,
        type: "document_uploaded" as const,
        description: "Document uploaded",
        timestamp: doc.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5)

    const analytics = {
      totalBots: bots.length,
      totalMessages: messages.length,
      totalDocuments: documents.length,
      avgResponseTime: 1.2 + Math.random() * 0.8, // Mock response time
      topBots,
      recentActivity,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 })
  }
}
