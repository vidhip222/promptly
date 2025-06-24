import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = params

    // Get job from database
    const { data: job, error } = await supabaseAdmin.from("crawl_jobs").select("*").eq("id", jobId).single()

    if (error || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Transform database format to API format
    const jobData = {
      id: job.id,
      url: job.url,
      purpose: job.purpose,
      status: job.status,
      progress: job.progress || 0,
      pagesFound: job.pages_found || 0,
      documentsExtracted: job.documents_extracted || 0,
      extractedContent: job.extracted_content || "",
      error: job.error,
    }

    return NextResponse.json(jobData)
  } catch (error) {
    console.error("Get crawl job error:", error)
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 })
  }
}
