import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic" // disable filesystem cache for this handler

export async function POST(request: NextRequest) {
  try {
    let { url, purpose } = await request.json<{
      url: string
      purpose: string
    }>()

    if (!url || !purpose) {
      return NextResponse.json({ error: "URL and purpose are required" }, { status: 400 })
    }

    // Ensure URL is absolute & uses https by default
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    console.log("🕷️ Starting web crawl for:", url)

    // Create crawl job record
    const jobId = Math.random().toString(36).slice(2, 11)
    const now = new Date().toISOString()

    const initialJob = {
      id: jobId,
      url,
      purpose,
      status: "crawling" as const,
      progress: 5,
      pages_found: 0,
      documents_extracted: 0,
      extracted_content: "",
      created_at: now,
    }

    await supabaseAdmin.from("crawl_jobs").insert(initialJob)

    // Step 1 — Fetch page
    let html: string
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Promptly Web Crawler 1.1" },
        redirect: "follow",
        cache: "no-store",
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
      }
      html = await res.text()
      await supabaseAdmin.from("crawl_jobs").update({ progress: 30, pages_found: 1 }).eq("id", jobId)
    } catch (err) {
      console.error("❌ Fetch error:", err)
      await markFailed(jobId, String(err))
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 })
    }

    // Step 2 — Extract text
    try {
      const textContent = extractTextFromHTML(html, purpose)
      await supabaseAdmin
        .from("crawl_jobs")
        .update({
          progress: 100,
          documents_extracted: 1,
          status: "completed",
          extracted_content: textContent,
        })
        .eq("id", jobId)

      console.log("✅ Crawl completed for:", url)

      return NextResponse.json({
        ...initialJob,
        status: "completed",
        progress: 100,
        documents_extracted: 1,
      })
    } catch (err) {
      console.error("❌ Extraction error:", err)
      await markFailed(jobId, String(err))
      return NextResponse.json({ error: "Failed to extract content" }, { status: 500 })
    }
  } catch (error) {
    console.error("Web crawler route error:", error)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}

async function markFailed(jobId: string, message: string) {
  await supabaseAdmin.from("crawl_jobs").update({ status: "failed", error: message, progress: 100 }).eq("id", jobId)
}

function extractTextFromHTML(html: string, purpose: string): string {
  // Remove script & style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")

  // Strip all HTML
  text = text.replace(/<[^>]*>/g, " ")

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim()

  // Simple relevance filter
  const purposeKeywords = purpose.toLowerCase().split(/\s+/)
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)

  const relevant = sentences.filter((s) => purposeKeywords.some((k) => s.toLowerCase().includes(k)))

  const content = relevant.length > 0 ? relevant.join(". ") : sentences.slice(0, 10).join(". ")

  return content.slice(0, 5000) // 5 kB cap
}
