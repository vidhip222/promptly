import path from "path"

// Cache the dynamically-imported parsers between calls
let pdfParse: ((buf: Buffer) => Promise<{ text: string }>) | undefined
let mammothExtract: ((opt: { buffer: Buffer }) => Promise<{ value: string }>) | undefined

export async function parseDocument(filePath: string, fileType: string, fileBuffer: Buffer): Promise<string> {
  console.log(`[Document Parser] Attempting to parse file: ${filePath}, Type: ${fileType}`)

  switch (fileType) {
    /* ────────────── simple text formats ────────────── */
    case "text/plain":
    case "text/csv":
      return fileBuffer.toString("utf8")

    /* ────────────── PDF ────────────── */
    case "application/pdf": {
      try {
        if (!pdfParse) {
          const { default: importedPdfParse } = await import("pdf-parse")
          pdfParse = importedPdfParse as typeof pdfParse
        }
        const data = await pdfParse(fileBuffer)
        console.log(`[Document Parser] Successfully parsed PDF: ${path.basename(filePath)}`)
        return data.text
      } catch (error) {
        console.error(`[Document Parser] Error parsing PDF ${path.basename(filePath)}:`, error)
        return `[Error parsing PDF: ${path.basename(
          filePath,
        )}. ${error instanceof Error ? error.message : String(error)}]`
      }
    }

    /* ────────────── DOCX ────────────── */
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      try {
        if (!mammothExtract) {
          const { default: mammoth } = await import("mammoth")
          mammothExtract = mammoth.extractRawText as typeof mammothExtract
        }

        // Some Mammoth builds expect `buffer`, others want `arrayBuffer`.
        // We’ll supply both to be safe.
        const arrayBuffer = fileBuffer.buffer.slice(
          fileBuffer.byteOffset,
          fileBuffer.byteOffset + fileBuffer.byteLength,
        )

        const result =
          // 1️⃣ Try the documented `buffer` option first …
          (await mammothExtract({ buffer: fileBuffer }).catch(() => null)) ||
          // 2️⃣ … and if it fails, fall back to `arrayBuffer`.
          (await mammothExtract({ arrayBuffer }))

        console.log(`[Document Parser] Successfully parsed DOCX: ${path.basename(filePath)}`)
        return result.value ?? result.text ?? ""
      } catch (error) {
        console.error(`[Document Parser] Error parsing DOCX ${path.basename(filePath)}:`, error)
        return `[Error parsing DOCX: ${path.basename(
          filePath,
        )}. ${error instanceof Error ? error.message : String(error)}]`
      }
    }

    /* ────────────── images (handled by Gemini) ────────────── */
    case "image/jpeg":
    case "image/png":
    case "image/gif":
    case "image/webp":
      console.log(`[Document Parser] Image file detected. No text extraction needed for ${fileType}.`)
      return "" // nothing to extract

    /* ────────────── unsupported ────────────── */
    default:
      console.warn(`[Document Parser] Unsupported file type for text extraction: ${fileType}`)
      return `[Content from unsupported file type: ${fileType}. No text extracted.]`
  }
}
