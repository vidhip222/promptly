// Document parsing utilities
export async function parseDocument(buffer: Buffer, fileType: string): Promise<string> {
  try {
    if (fileType === "text/plain") {
      return buffer.toString("utf-8")
    }

    if (fileType === "text/csv") {
      return buffer.toString("utf-8")
    }

    if (fileType === "application/pdf") {
      // For production, implement PDF parsing with pdf-parse or similar
      // For now, return a mock response
      return `[PDF Content] This is a sample PDF document with important company information about policies, procedures, and guidelines. The document contains multiple sections covering various topics relevant to employees and operations.`
    }

    if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // For production, implement DOCX parsing with mammoth or similar
      // For now, return a mock response
      return `[DOCX Content] This is a sample Word document containing detailed information about company benefits, leave policies, and employee handbook guidelines. The document includes structured information that can be used to answer employee questions.`
    }

    // Default to text parsing
    return buffer.toString("utf-8")
  } catch (error) {
    console.error("Document parsing error:", error)
    throw new Error("Failed to parse document")
  }
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(" ")
  const chunks: string[] = []

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ")
    if (chunk.trim()) {
      chunks.push(chunk)
    }
  }

  return chunks
}
