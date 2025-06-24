import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error(
    "Google Generative AI API key is missing. Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable.",
  )
}

const genAI = new GoogleGenerativeAI(apiKey)

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" })
    const result = await model.embedContent(text)
    return result.embedding.values
  } catch (error) {
    console.error("Embedding generation error:", error)
    throw new Error("Failed to generate embedding")
  }
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  context?: string,
  botConfig?: any,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    let systemPrompt = "You are a helpful AI assistant."

    if (botConfig) {
      systemPrompt = `You are ${botConfig.name}, a ${botConfig.personality} assistant. ${botConfig.instructions}`
    }

    let prompt = systemPrompt + "\n\n"

    if (context) {
      prompt += `Context from documents:\n${context}\n\n`
    }

    prompt += "Conversation:\n"
    messages.forEach((msg) => {
      prompt += `${msg.role}: ${msg.content}\n`
    })
    prompt += "assistant:"

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Chat generation error:", error)
    throw new Error("Failed to generate chat response")
  }
}

/**
 * A convenience wrapper that returns the *entire* response text instead of a
 * stream.  Useful for server → server calls where you just need the final
 * answer.
 *
 * It internally delegates to `generateChatResponse`.
 */
export async function generateChatResponseSync(
  messages: Array<{ role: string; content: string }>,
  context?: string,
  botConfig?: any,
): Promise<string> {
  return generateChatResponse(messages, context, botConfig)
}

export async function extractTextFromUrl(url: string, purpose: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Extract and summarize the main content from this URL for the purpose of: ${purpose}
    
    URL: ${url}
    
    Please provide a clean, structured summary of the key information that would be useful for a chatbot to answer questions about this topic.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("URL extraction error:", error)
    throw new Error("Failed to extract content from URL")
  }
}
