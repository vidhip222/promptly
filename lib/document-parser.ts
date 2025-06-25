import path from "path"
import pdf from "pdf-parse" // Import pdf-parse
import mammoth from "mammoth" // Import mammoth

export async function parseDocument(filePath: string, fileType: string, fileBuffer: Buffer): Promise<string> {
  console.log(`[Document Parser] Attempting to parse file: ${filePath}, Type: ${fileType}`)

  switch (fileType) {
    case "text/plain":
    case "text/csv":
      return fileBuffer.toString("utf8")

    case "application/pdf":
      try {
        const data = await pdf(fileBuffer)
        console.log(`[Document Parser] Successfully parsed PDF: ${path.basename(filePath)}`)
        return data.text
      } catch (error) {
        console.error(`[Document Parser] Error parsing PDF ${path.basename(filePath)}:`, error)
        return `[Error parsing PDF: ${path.basename(filePath)}. ${error instanceof Error ? error.message : String(error)}]`
      }

    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        console.log(`[Document Parser] Successfully parsed DOCX: ${path.basename(filePath)}`)
        return result.value
      } catch (error) {
        console.error(`[Document Parser] Error parsing DOCX ${path.basename(filePath)}:`, error)
        return `[Error parsing DOCX: ${path.basename(filePath)}. ${error instanceof Error ? error.message : String(error)}]`
      }

    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      console.log(`[Document Parser] Image file detected. No text extraction needed for ${fileType}.`)
      return "" // No text content to extract for images here

    default:
      console.warn(`[Document Parser] Unsupported file type for text extraction: ${fileType}`)
      return `[Content from unsupported file type: ${fileType}. No text extracted.]`
  }
}
