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
    let documentList = []

    // Get real bot data and documents - FIXED QUERY
    if (!isGuest && botId) {
      try {
        console.log("🔍 Checking bot:", botId)

        // Get bot configuration
        const { data: bot, error: botError } = await supabaseAdmin.from("bots").select("*").eq("id", botId).single()

        if (bot && !botError) {
          botConfig = {
            name: bot.name,
            personality: bot.personality || "helpful and professional",
            instructions: bot.instructions || "Be helpful and provide accurate information",
            department: bot.department || "General",
          }

          console.log("🤖 Bot found:", botConfig.name, "| Department:", botConfig.department)

          // Get documents for this bot - SEPARATE QUERY
          const { data: documents, error: docsError } = await supabaseAdmin
            .from("documents")
            .select("*")
            .eq("bot_id", botId)
            .eq("status", "processed")

          console.log("📄 Documents query result:", documents?.length || 0, "documents found")

          if (documents && documents.length > 0 && !docsError) {
            hasDocuments = true
            documentCount = documents.length
            documentList = documents

            console.log("✅ Found", documentCount, "processed documents:")
            documents.forEach((doc, index) => {
              console.log(`  ${index + 1}. ${doc.name} (${doc.file_type})`)
            })

            // Create document context with actual content
            documentContext = `You have access to ${documentCount} uploaded document(s):\n\n`

            for (const doc of documents) {
              documentContext += `Document: ${doc.name}\n`
              if (doc.content) {
                // Use actual document content
                documentContext += `Content: ${doc.content.substring(0, 2000)}...\n\n`
              }
            }
          } else {
            console.log("❌ No processed documents found for bot", botId)
          }
        } else {
          console.log("❌ Bot not found:", botError)
        }
      } catch (error) {
        console.error("❌ Failed to get bot info:", error)
      }
    }

    // Create specialized system prompt with ACTUAL document content
    const systemPrompt = `You are ${botConfig.name}, a ${botConfig.personality} AI assistant specializing in ${botConfig.department}.

IMPORTANT IDENTITY:
- You are a ${botConfig.department} specialist bot
- You work specifically in the ${botConfig.department} domain

DOCUMENT AWARENESS:
${
  hasDocuments
    ? `You have ${documentCount} document(s) uploaded and available with the following content:

${documentContext}

ANSWER QUESTIONS using the information from these documents. If someone asks about dress code, policies, procedures, or any topic covered in your documents, provide specific answers based on the content above.

If the question is not covered in your documents, respond with: "I don't have information about that specific topic in my current documents. Please upload relevant ${botConfig.department} documents or ask questions related to the uploaded materials."`
    : `You currently have NO documents uploaded. Respond with: "I don't have any documents uploaded yet. Please upload relevant ${botConfig.department} documents first so I can assist you with specific questions about your materials."`
}

BEHAVIOR RULES:
1. Always identify yourself as a ${botConfig.department} specialist
2. ${hasDocuments ? "Use the specific information from the uploaded documents to answer questions" : "Request document upload first"}
3. Be helpful and provide detailed answers when you have the information
4. ${botConfig.instructions}

Remember: You are a ${botConfig.department} bot with ${documentCount} document(s) containing specific information to help users.`

    console.log("💬 Generating response for", botConfig.department, "bot with", documentCount, "documents")

    // Generate response using Gemini with document context
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
              documentsUsed: documentList.map((d) => d.name),
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
      sources: hasDocuments ? documentList.map((d) => d.name) : [],
      context: hasDocuments,
      botType: botConfig.department,
      documentCount,
      hasDocuments,
      documentsUsed: documentList.map((d) => d.name),
    })
  } catch (error) {
    console.error("❌ Chat error:", error)
    return NextResponse.json({ error: "Chat failed: " + error.message }, { status: 500 })
  }
}
