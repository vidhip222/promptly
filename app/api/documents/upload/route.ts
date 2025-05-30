import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { embed } from "ai"
import { cookies } from "next/headers"

// Mock document text extraction (in production, use libraries like pdf-parse, mammoth, etc.)
async function extractTextFromFile(file: File): Promise<string> {
  const text = await file.text()

  // Simulate different file type processing
  if (file.type === "application/pdf") {
    return `[PDF Content] ${text.slice(0, 1000)}...`
  } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return `[DOCX Content] ${text.slice(0, 1000)}...`
  } else if (file.type === "text/csv") {
    return `[CSV Data] ${text.slice(0, 1000)}...`
  }

  return text
}

// Chunk text into smaller pieces for better embedding
function chunkText(text: string, chunkSize = 1000): string[] {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const botId = formData.get("botId") as string

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const processedFiles = []

    for (const file of files) {
      try {
        // 1. Extract text content
        const textContent = await extractTextFromFile(file)

        // 2. Chunk the content
        const chunks = chunkText(textContent)

        // 3. Generate embeddings for each chunk
        const embeddings = []
        for (const chunk of chunks) {
          const { embedding } = await embed({
            model: openai.embedding("text-embedding-3-small"),
            value: chunk,
          })

          embeddings.push({
            text: chunk,
            embedding,
            metadata: {
              fileName: file.name,
              fileType: file.type,
              chunkIndex: embeddings.length,
            },
          })
        }

        // 4. Store in mock vector database (in production, use Pinecone)
        const fileData = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          botId,
          userId: user.id,
          uploadedAt: new Date().toISOString(),
          status: "processed",
          chunksCount: chunks.length,
          embeddings, // In production, store in vector DB
          textContent: textContent.slice(0, 500) + "...", // Preview
        }

        processedFiles.push(fileData)
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        processedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          botId,
          userId: user.id,
          uploadedAt: new Date().toISOString(),
          status: "failed",
          error: "Processing failed",
        })
      }
    }

    return NextResponse.json({
      success: true,
      files: processedFiles,
      message: `Successfully processed ${processedFiles.filter((f) => f.status === "processed").length} of ${files.length} file(s)`,
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Failed to process files" }, { status: 500 })
  }
}
