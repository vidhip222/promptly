import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId, isGuest } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let botConfig = {
      name: "AI Assistant",
      personality: "helpful and professional",
      instructions: "You are a helpful AI assistant.",
      department: "General",
    }

    let relevantContext = ""
    const sources = []

    // Get real bot data and perform RAG search
    if (!isGuest && botId) {
      try {
        // Get bot configuration from database
        const { data: bot, error: botError } = await supabaseAdmin.from("bots").select("*").eq("id", botId).single()

        if (bot && !botError) {
          botConfig = {
            name: bot.name,
            personality: bot.personality || "helpful and professional",
            instructions: bot.instructions || "Be helpful and provide accurate information",
            department: bot.department || "General",
          }

          console.log("🤖 Using bot config:", botConfig.name, "-", botConfig.department)

          // Perform semantic search using embeddings API
          const searchResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings?query=${encodeURIComponent(message)}&botId=${botId}&limit=3`,
            {
              method: "GET",
            },
          )

          if (searchResponse.ok) {
            const searchData = await searchResponse.json()

            if (searchData.success && searchData.results.length > 0) {
              console.log("🔍 Found", searchData.results.length, "relevant document chunks")

              relevantContext = "Based on the following relevant information from your documents:\n\n"

              searchData.results.forEach((result, index) => {
                if (result.score > 0.7) {
                  // Only use high-confidence matches
                  relevantContext += `[Source ${index + 1}]: ${result.text}\n\n`
                  sources.push(`Document chunk ${result.chunkIndex + 1}`)
                }
              })

              if (sources.length === 0) {
                relevantContext = ""
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Failed to get bot info or perform RAG:", error)
      }
    }

    // Create RAG-enhanced system prompt
    const systemPrompt = `You are ${botConfig.name}, a ${botConfig.personality} AI assistant specializing in ${botConfig.department}.

${botConfig.instructions}

IMPORTANT RULES:
1. You are a ${botConfig.department} specialist bot
2. ${
      relevantContext
        ? "Answer the question using ONLY the provided document context below. If the context doesn't contain relevant information, say 'I don't have information about that in my current documents.'"
        : "You don't have any relevant documents for this question. Please ask the user to upload relevant documents or ask questions related to your uploaded materials."
    }
3. Always stay in character as a ${botConfig.department} assistant
4. Be helpful but only within your domain and available documents
5. Cite your sources when using document information

${relevantContext}

Remember: Base your answers on the document context provided above.`

    console.log("💬 Generating response with", sources.length, "sources")

    // Generate response using Gemini with RAG context
    const messages = [{ role: "user", content: message }]
    const response = await generateChatResponse(messages, systemPrompt, botConfig)

    // Store conversation in database
    if (!isGuest && botId && userId) {
      try {
        await supabaseAdmin.from("messages").insert([
          {
            bot_id: botId,
            user_id: userId,
            content: message,
            role: "user",
            metadata: {
              hasContext: sources.length > 0,
              sourceCount: sources.length,
            },
          },
          {
            bot_id: botId,
            user_id: userId,
            content: response,
            role: "assistant",
            metadata: {
              hasContext: sources.length > 0,
              sources: sources,
              botType: botConfig.department,
            },
          },
        ])
      } catch (error) {
        console.error("❌ Failed to store messages:", error)
      }
    }

    return NextResponse.json({
      response,
      sources,
      context: sources.length > 0,
      botType: botConfig.department,
      ragEnabled: true,
    })
  } catch (error) {
    console.error("❌ Chat error:", error)
    return NextResponse.json({ error: "Chat failed: " + error.message }, { status: 500 })
  }
}
