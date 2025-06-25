import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const botId = params.id
    console.log(`🔄 Retrain request received for bot ${botId}`)

    // In this multimodal Gemini setup, documents are processed on-the-fly
    // during chat. This 'retrain' route primarily serves as a user-facing
    // confirmation that the bot's knowledge is refreshed and ready to use
    // the latest documents and instructions.

    // Log the action for audit purposes
    const { data: bot, error: getBotError } = await supabaseAdmin
      .from("bots")
      .select("user_id, name")
      .eq("id", botId)
      .single()

    if (getBotError || !bot) {
      console.error("❌ Bot not found for retrain:", getBotError)
      return NextResponse.json({ error: "Bot not found" }, { status: 404 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      action: "bot_retrained",
      resource_type: "bot",
      resource_id: botId,
      user_id: bot.user_id,
      metadata: {
        bot_name: bot.name,
        retrained_at: new Date().toISOString(),
      },
    })

    console.log(`✅ Bot ${botId} retraining action logged. Documents and instructions will be used in next chat.`)
    return NextResponse.json({
      success: true,
      message: "Bot retraining initiated. Documents and instructions will be used in next chat.",
    })
  } catch (error) {
    console.error("❌ Retrain bot error:", error)
    return NextResponse.json({ error: "Failed to retrain bot" }, { status: 500 })
  }
}
