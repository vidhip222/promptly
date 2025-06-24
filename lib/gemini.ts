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
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" })
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

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

export async function generateChatResponseSync(
  messages: Array<{ role: string; content: string }>,
  context?: string,
  botConfig?: any,
): Promise<string> {
  return generateChatResponse(messages, context, botConfig)
}

export async function extractTextFromUrl(url: string, purpose: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

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

export async function generateBotConfiguration(template: any): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `Create a comprehensive bot configuration for a ${template.name} in the ${template.department} department.

Template Info:
- Name: ${template.name}
- Description: ${template.description}
- Department: ${template.department}
- Base Personality: ${template.personality}
- Goal: ${template.goal}

Generate:
1. Enhanced personality traits (3-4 specific traits)
2. Detailed instructions (200-300 words) for how the bot should behave
3. 5-7 example questions this bot should be able to answer
4. Tone and communication style guidelines
5. Specific do's and don'ts for this type of bot

Return as JSON with keys: enhancedPersonality, detailedInstructions, exampleQuestions, toneGuidelines, guidelines`

    const result = await model.generateContent(prompt)
    const response = await result.response

    try {
      return JSON.parse(response.text())
    } catch {
      // Fallback if JSON parsing fails
      return {
        enhancedPersonality: template.personality,
        detailedInstructions: template.instructions,
        exampleQuestions: [
          "How can I help you today?",
          "What information do you need?",
          "Can you tell me more about your question?",
        ],
        toneGuidelines: "Professional and helpful",
        guidelines: "Always be respectful and provide accurate information",
      }
    }
  } catch (error) {
    console.error("Bot configuration generation error:", error)
    // Return fallback configuration
    return {
      enhancedPersonality: template.personality,
      detailedInstructions: template.instructions,
      exampleQuestions: [
        "How can I help you today?",
        "What information do you need?",
        "Can you tell me more about your question?",
      ],
      toneGuidelines: "Professional and helpful",
      guidelines: "Always be respectful and provide accurate information",
    }
  }
}
