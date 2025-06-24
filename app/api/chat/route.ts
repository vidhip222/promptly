import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId, isGuest } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Mock bot configuration
    const botConfig = {
      name: "AI Assistant",
      personality: "helpful and professional",
      instructions:
        "You are a helpful AI assistant. Provide clear, accurate, and helpful responses using Gemini 2.0 Flash.",
    }

    // Generate response using Gemini 2.0 Flash
    const messages = [{ role: "user", content: message }]
    const response = await generateChatResponse(messages, undefined, botConfig)

    return NextResponse.json({
      response,
      sources: [],
      context: false,
    })
  } catch (error) {
    console.error("Chat error:", error)
    return NextResponse.json({ error: "Chat failed: " + error.message }, { status: 500 })
  }
}
