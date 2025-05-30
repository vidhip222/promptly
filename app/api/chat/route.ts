import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { cookies } from "next/headers"

export const maxDuration = 30

// Mock vector search function (in production, use Pinecone)
async function searchDocuments(
  query: string,
  botId: string,
): Promise<Array<{ text: string; source: string; score: number }>> {
  // Mock document chunks with relevance scores
  const mockDocuments = [
    {
      text: "Employees are entitled to 15 days of paid vacation per year. Vacation requests must be submitted at least 2 weeks in advance through the HR portal.",
      source: "Employee Handbook.pdf",
      score: 0.95,
    },
    {
      text: "Our health insurance covers 100% of premiums for employees and 80% for dependents. Dental and vision are included.",
      source: "Benefits Guide.docx",
      score: 0.88,
    },
    {
      text: "Sick leave is unlimited but requires a doctor's note for absences longer than 3 consecutive days.",
      source: "Leave Policy.pdf",
      score: 0.82,
    },
  ]

  // Filter based on query relevance (mock)
  return mockDocuments
    .filter(
      (doc) =>
        query.toLowerCase().includes("vacation") ||
        query.toLowerCase().includes("benefits") ||
        query.toLowerCase().includes("sick") ||
        query.toLowerCase().includes("leave"),
    )
    .slice(0, 3)
}

export async function POST(req: Request) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { messages, botId } = await req.json()
    const lastMessage = messages[messages.length - 1]

    // Search for relevant documents
    const relevantDocs = await searchDocuments(lastMessage.content, botId)

    // Build document context with citations
    let documentContext = ""
    const citations = []

    if (relevantDocs.length > 0) {
      documentContext = "Based on the following company documents:\n\n"
      relevantDocs.forEach((doc, index) => {
        documentContext += `Document ${index + 1} (${doc.source}): "${doc.text}"\n\n`
        citations.push({
          source: doc.source,
          text: doc.text,
          relevance: doc.score,
        })
      })
    }

    // Enhanced system prompt with document context and citation instructions
    const systemPrompt = `You are an HR Assistant chatbot for a company. You are professional, helpful, and knowledgeable about HR policies, benefits, and procedures.

    ${documentContext}

    IMPORTANT CITATION RULES:
    - When referencing information from company documents, always include the source in your response
    - Format citations as: "According to [Document Name], ..."
    - If you use information from multiple documents, cite each one
    - If no relevant documents are found, clearly state you're providing general guidance and recommend contacting HR

    Key guidelines:
    - Always prioritize information from the company documents provided above
    - Be professional but friendly in your responses
    - If you don't know something specific to the company, acknowledge it and suggest they contact HR directly
    - Keep responses concise but comprehensive
    - Always maintain confidentiality and privacy

    You can help with:
    - Company policies and procedures
    - Benefits information
    - Leave and time-off policies
    - Performance review processes
    - General HR questions
    - Onboarding information

    If asked about specific employee information or confidential matters, politely decline and direct them to speak with HR directly.`

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 500,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}
