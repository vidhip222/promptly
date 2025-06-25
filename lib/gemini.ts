import { GoogleGenerativeAI, type Part } from "@google/generative-ai"

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY

// Log the detected API Key (or lack thereof) for debugging in preview
console.log(`[Gemini] Detected API Key (first 5 chars): ${apiKey ? apiKey.substring(0, 5) + "..." : "None"}`)

if (!apiKey) {
  throw new Error(
    "Google Generative AI API key is missing. Set GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_GEMINI_API_KEY environment variable.",
  )
}

const genAI = new GoogleGenerativeAI(apiKey)

export async function generateChatResponse(
  userMessage: string,
  systemPrompt: string,
  // documentParts can now contain a mix of text and inlineData parts
  documentParts: Part[],
  botConfig?: any,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const contents: Part[] = [
      { text: systemPrompt }, // System prompt as the first part
      { text: userMessage }, // User's message
      ...documentParts, // Spread the prepared document parts here
    ]

    const result = await model.generateContent({
      contents: [{ role: "user", parts: contents }],
    })
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error("Chat generation error:", error)
    throw new Error("Failed to generate chat response")
  }
}

export async function generateChatResponseSync(
  userMessage: string,
  systemPrompt: string,
  documentParts: Part[],
  botConfig?: any,
): Promise<string> {
  return generateChatResponse(userMessage, systemPrompt, documentParts, botConfig)
}

export async function extractTextFromUrl(url: string, purpose: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) // Use multimodal model for URL content

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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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

/**
 * Stub kept for backward-compatibility with older imports.
 * It returns a zero-filled 1536-dimensional vector (same length as OpenAI Ada v2)
 * so that anything expecting an embedding array will still receive the right type.
 * Remove once the rest of the codebase no longer imports `generateEmbedding`.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  // Returning zeros keeps cosine-similarity math safe (zero similarity).
  return new Array(1536).fill(0)
}
