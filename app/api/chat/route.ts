import { type NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"
import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Part } from "@/types/gemini" // Declare the Part variable

export async function POST(request: NextRequest) {
  try {
    const { message, botId, userId, isGuest } = await request.json()

    console.log("--- Chat Request Received ---")
    console.log("Message:", message ? message.substring(0, 50) + "..." : "N/A")
    console.log("Bot ID:", botId)
    console.log("User ID:", userId)
    console.log("Is Guest:", isGuest)

    if (!message) {
      console.error("❌ Message is required")
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    let botConfig = {
      name: "AI Assistant", // Default for guests or if botId not found
      personality: "helpful and professional",
      instructions: "You are a helpful AI assistant.",
      department: "General",
    }

    // documentParts will now contain a mix of text and inlineData parts for Gemini
    const documentParts: Part[] = []
    let hasDocuments = false
    let documentCount = 0
    let documentNames: string[] = []

    // Fetch bot config and documents only if botId is provided (for both guest and authenticated)
    if (botId) {
      try {
        console.log("🔍 Attempting to fetch bot and documents...")

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
        } else {
          console.log("❌ Bot not found or error fetching bot:", botError?.message || "Unknown error")
        }

        // Get completed documents and their file paths AND content
        const { data: documents, error: docsError } = await supabaseAdmin
          .from("documents")
          .select("id, name, file_path, file_type, content") // NOW SELECTING 'content'
          .eq("bot_id", botId)
          .eq("status", "completed") // Only use completed documents (uploaded to storage)

        console.log("📄 Documents query result:", documents?.length || 0, "documents found.")
        if (docsError) {
          console.error("❌ Error fetching documents:", docsError.message)
        }

        if (documents && documents.length > 0 && !docsError) {
          documentCount = documents.length
          documentNames = documents.map((d) => d.name)
          console.log("✅ Found", documentCount, "completed documents for processing.")

          for (const doc of documents) {
            console.log(`  - Processing document: ${doc.name} (Path: ${doc.file_path}, Type: ${doc.file_type})`)

            // Determine how to send the document to Gemini based on file type
            if (doc.file_type.startsWith("image/")) {
              // For images, fetch binary and send as inlineData
              const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
                .from("documents")
                .createSignedUrl(doc.file_path, 3600) // URL valid for 1 hour

              if (signedUrlError) {
                console.error(`❌ Failed to create signed URL for ${doc.name}:`, signedUrlError.message)
                continue
              }
              console.log(`  ✅ Signed URL created for image ${doc.name}.`)

              try {
                const fileResponse = await fetch(signedUrlData.signedUrl)
                if (!fileResponse.ok) {
                  throw new Error(`HTTP error! status: ${fileResponse.status} for ${doc.name}`)
                }
                const arrayBuffer = await fileResponse.arrayBuffer()
                const base64Data = Buffer.from(arrayBuffer).toString("base64")

                documentParts.push({
                  inlineData: {
                    data: base64Data,
                    mimeType: doc.file_type,
                  },
                })
                console.log(`  ✅ Fetched and base64 encoded image: ${doc.name}. Size: ${base64Data.length} bytes.`)
              } catch (fetchError: any) {
                console.error(`❌ Failed to fetch or encode image ${doc.name}:`, fetchError.message)
              }
            } else if (doc.content) {
              // For text-based documents (PDF, DOCX, TXT, CSV), use the pre-extracted content
              documentParts.push({
                text: `--- Document: ${doc.name} ---\n${doc.content}\n--- End of Document: ${doc.name} ---`,
              })
              console.log(`  ✅ Added extracted text content for document: ${doc.name}. Length: ${doc.content.length}`)
            } else {
              console.warn(`⚠️ Document ${doc.name} (${doc.file_type}) has no content and is not an image. Skipping.`)
            }
          }
          // Set hasDocuments to true ONLY if at least one document part was successfully prepared for Gemini
          hasDocuments = documentParts.length > 0
          console.log(`Final documentParts count for Gemini: ${documentParts.length}. hasDocuments: ${hasDocuments}`)
        } else {
          console.log("❌ No completed documents found or error for bot", botId)
        }
      } catch (error: any) {
        console.error("❌ Failed to get bot info or documents (outer try-catch):", error.message)
      }
    } else {
      console.log("ℹ️ No Bot ID provided. Using default AI Assistant config.")
    }

    // Create specialized system prompt
    const baseIdentityPrompt = `You are ${botConfig.name}, a ${botConfig.personality} AI assistant specializing in ${botConfig.department}.

IMPORTANT IDENTITY:
- You are a ${botConfig.department} specialist bot
- You work specifically in the ${botConfig.department} domain
${botConfig.instructions}
`

    let systemPrompt: string
    if (hasDocuments) {
      systemPrompt = `${baseIdentityPrompt}

DOCUMENT AWARENESS:
You have ${documentCount} document(s) uploaded and available. Your responses MUST be based SOLELY on the information contained within these documents. You can directly analyze the content of these files.

The documents available are: ${documentNames.join(", ")}.

ANSWER QUESTIONS using ONLY the information from these documents. Do NOT invent information.

If the question is not covered in your documents, or if you cannot find a direct answer within the provided content, respond with: "I don't have information about that specific topic in my current documents. Please upload relevant ${botConfig.department} documents or ask questions related to the uploaded materials."

BEHAVIOR RULES:
1. Always identify yourself as a ${botConfig.department} specialist.
2. Use the specific information from the uploaded documents to answer questions. Do NOT invent information.
3. Be helpful and provide detailed answers when you have the information.
`
      console.log("💡 Using document-aware prompt.")
    } else {
      // No documents available or failed to load them
      systemPrompt = `${baseIdentityPrompt}

DOCUMENT AWARENESS:
You currently have NO documents uploaded or processed.

BEHAVIOR RULES:
1. Always identify yourself as a ${botConfig.department} specialist.
2. You do not have access to any specific documents.
3. If asked about specific documents or information you don't have, politely state that you are a ${botConfig.department} specialist and cannot provide that specific information without relevant documents.
4. For general questions, provide concise and helpful answers, but always maintain your identity as a ${botConfig.department} specialist.
5. Do NOT invent information.
6. Respond with: "I don't have any documents uploaded yet. Please upload relevant ${botConfig.department} documents first so I can assist you with specific questions about your materials."`
      console.log("💡 Using 'no documents' prompt, but maintaining bot identity.")
    }

    console.log(
      "💬 Generating response for",
      botConfig.name,
      "with",
      documentParts.length,
      "document parts prepared for Gemini.",
    )

    // Generate response using Gemini with multimodal input
    const response = await generateChatResponse(message, systemPrompt, documentParts, botConfig)

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
              documentsUsed: documentNames,
            },
          },
        ])
        console.log("💾 Stored conversation in database")
      } catch (error: any) {
        console.error("❌ Failed to store messages:", error.message)
      }
    }

    console.log("--- Chat Request Completed ---")
    return NextResponse.json({
      response,
      sources: documentNames,
      context: hasDocuments,
      botType: botConfig.department,
      documentCount,
      hasDocuments,
      documentsUsed: documentNames,
    })
  } catch (error: any) {
    console.error("❌ Chat error (top-level catch):", error.message)
    return NextResponse.json({ error: "Chat failed: " + error.message }, { status: 500 })
  }
}
