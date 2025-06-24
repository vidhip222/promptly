import { type NextRequest, NextResponse } from "next/server"

// Import the same crawlJobs map from the main route
const crawlJobs = new Map()

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const job = crawlJobs.get(params.jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error("Get crawl job error:", error)
    return NextResponse.json({ error: "Failed to get job status" }, { status: 500 })
  }
}
