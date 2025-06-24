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

    let documentContext = ""
    let hasDocuments = false
    let documentCount = 0

    // Get real bot data and documents
    if (!isGuest && botId) {
      try {
        // Get bot configuration from database
        const { data: bot, error: botError } = await supabaseAdmin
          .from("bots")
          .select(`
            *,
            documents(*)
          `)
          .eq("id", botId)
          .single()

        if (bot && !botError) {
          botConfig = {
            name: bot.name,
            personality: bot.personality || "helpful and professional",
            instructions: bot.instructions || "Be helpful and provide accurate information",
            department: bot.department || "General",
          }

          console.log("🤖 Bot:", botConfig.name, "| Department:", botConfig.department)

          // Check for documents
          if (bot.documents && bot.documents.length > 0) {
            hasDocuments = true
            documentCount = bot.documents.length
            console.log("📄 Found", documentCount, "documents for bot")

            // Create document context (in production, this would use vector search)
            documentContext = `You have access to ${documentCount} uploaded document(s):\n`
            bot.documents.forEach((doc, index) => {
              documentContext += `${index + 1}. ${doc.name} (Status: ${doc.status})\n`
            })
            documentContext += "\nUse this information to answer questions.\n"
          }
        }
      } catch (error) {
        console.error("❌ Failed to get bot info:", error)
      }
    }

    // Create specialized system prompt
    const systemPrompt = `You are ${botConfig.name}, a ${botConfig.personality} AI assistant specializing in ${botConfig.department}.

IMPORTANT IDENTITY:
- You are a ${botConfig.department} specialist bot
- You work specifically in the ${botConfig.department} domain
- Do NOT say you help with "a wide range of topics" - be specific to your department

DOCUMENT AWARENESS:
${
  hasDocuments
    ? `You have ${documentCount} document(s) uploaded and available:
${documentContext}

ONLY answer questions based on these uploaded documents. If the question is not covered in your documents, respond with: "I don't have information about that in my current documents. Please upload relevant ${botConfig.department} documents or ask questions related to the uploaded materials."`
    : `You currently have NO documents uploaded. Respond with: "I don't have any documents uploaded yet. Please upload relevant ${botConfig.department} documents first so I can assist you with specific questions about your materials."`
}

BEHAVIOR RULES:
1. Always identify yourself as a ${botConfig.department} specialist
2. ${hasDocuments ? "Only use information from uploaded documents" : "Request document upload first"}
3. Be helpful but stay within your ${botConfig.department} domain
4. ${botConfig.instructions}

Remember: You are a ${botConfig.department} bot with ${documentCount} document(s) available.`

    console.log("💬 Generating response for", botConfig.department, "bot with", documentCount, "documents")

    // Generate response using Gemini
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
              hasDocuments,
              documentCount,
              botDepartment: botConfig.department,
            },
          },
          {
            bot_id: botId,
            user_id: userId,
            content: response,
            role: "assistant",
            metadata: {
              hasDocuments,
              documentCount,
              botType: botConfig.department,
            },
          },
        ])
        console.log("💾 Stored conversation in database")
      } catch (error) {
        console.error("❌ Failed to store messages:", error)
      }
    }

    return NextResponse.json({
      response,
      sources: hasDocuments ? [`${documentCount} uploaded document(s)`] : [],
      context: hasDocuments,
      botType: botConfig.department,
      documentCount,
      hasDocuments,
    })
  } catch (error) {
    console.error("❌ Chat error:", error)
    return NextResponse.json({ error: "Chat failed: " + error.message }, { status: 500 })
  }
}
