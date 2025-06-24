import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { url, purpose } = await request.json()

    if (!url || !purpose) {
      return NextResponse.json({ error: "URL and purpose are required" }, { status: 400 })
    }

    console.log("🕷️ Starting web crawl for:", url)

    // Create crawl job
    const jobId = Math.random().toString(36).substr(2, 9)
    const crawlJob = {
      id: jobId,
      url,
      purpose,
      status: "pending" as const,
      progress: 0,
      pagesFound: 0,
      documentsExtracted: 0,
      extractedContent: "",
      createdAt: new Date().toISOString(),
    }

    // Store job in database
    await supabaseAdmin.from("crawl_jobs").insert({
      id: jobId,
      url,
      purpose,
      status: "pending",
      progress: 0,
      pages_found: 0,
      documents_extracted: 0,
      extracted_content: "",
    })

    // Start crawling process
    setTimeout(async () => {
      try {
        console.log("🔍 Crawling website:", url)

        // Update status to crawling
        await supabaseAdmin.from("crawl_jobs").update({ status: "crawling", progress: 10 }).eq("id", jobId)

        // Simulate crawling with actual fetch
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Promptly Web Crawler 1.0",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.status}`)
        }

        const html = await response.text()
        console.log("📄 Fetched HTML content, length:", html.length)

        // Update progress
        await supabaseAdmin
          .from("crawl_jobs")
          .update({ status: "processing", progress: 50, pages_found: 1 })
          .eq("id", jobId)

        // Extract text content from HTML
        const textContent = extractTextFromHTML(html, purpose)
        console.log("📝 Extracted text content, length:", textContent.length)

        // Update progress
        await supabaseAdmin.from("crawl_jobs").update({ progress: 80, documents_extracted: 1 }).eq("id", jobId)

        // Final update with completed status
        await supabaseAdmin
          .from("crawl_jobs")
          .update({
            status: "completed",
            progress: 100,
            extracted_content: textContent,
          })
          .eq("id", jobId)

        console.log("✅ Web crawl completed successfully for:", url)
      } catch (error) {
        console.error("❌ Crawl failed:", error)
        await supabaseAdmin
          .from("crawl_jobs")
          .update({
            status: "failed",
            error: error.message,
          })
          .eq("id", jobId)
      }
    }, 1000)

    return NextResponse.json(crawlJob)
  } catch (error) {
    console.error("Web crawler error:", error)
    return NextResponse.json({ error: "Failed to start crawling" }, { status: 500 })
  }
}

function extractTextFromHTML(html: string, purpose: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, " ")

  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim()

  // Extract relevant sections based on purpose
  const lines = text.split(/[.!?]+/).filter((line) => line.trim().length > 20)

  // Filter content based on purpose keywords
  const purposeKeywords = purpose.toLowerCase().split(/\s+/)
  const relevantLines = lines.filter((line) => {
    const lineLower = line.toLowerCase()
    return purposeKeywords.some((keyword) => lineLower.includes(keyword))
  })

  // If no relevant content found, return first part of general content
  const finalContent = relevantLines.length > 0 ? relevantLines.join(". ") : lines.slice(0, 10).join(". ")

  return finalContent.substring(0, 5000) // Limit to 5000 characters
}
