import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(request: NextRequest) {
  try {
    const { url, purpose } = await request.json()

    if (!url || !purpose) {
      return NextResponse.json({ error: "URL and purpose are required" }, { status: 400 })
    }

    // Create crawl job
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const job = {
      id: jobId,
      url,
      purpose,
      status: "pending" as const,
      progress: 0,
      pagesFound: 0,
      documentsExtracted: 0,
      createdAt: new Date().toISOString(),
    }

    // Start crawling process (in background)
    startCrawling(job)

    return NextResponse.json(job)
  } catch (error) {
    console.error("Web crawler error:", error)
    return NextResponse.json({ error: "Failed to start crawling" }, { status: 500 })
  }
}

async function startCrawling(job: any) {
  try {
    // Update status to crawling
    job.status = "crawling"
    job.progress = 10

    // Use Gemini to analyze the website and determine what to crawl
    const { text: crawlPlan } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Analyze this website URL: ${job.url}
      
      Purpose: ${job.purpose}
      
      Create a crawling plan that identifies:
      1. What specific pages or sections to focus on
      2. What type of content to extract
      3. How to organize the extracted content
      
      Respond with a structured plan.`,
    })

    job.progress = 30

    // Simulate crawling process
    await new Promise((resolve) => setTimeout(resolve, 2000))
    job.status = "processing"
    job.progress = 60
    job.pagesFound = Math.floor(Math.random() * 50) + 10

    // Use Gemini to extract and process content
    const { text: extractedContent } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Based on the crawling plan: ${crawlPlan}
      
      Extract and clean content from the website: ${job.url}
      
      Focus on: ${job.purpose}
      
      Return clean, structured content that would be useful for training an AI bot.
      Remove navigation, ads, and irrelevant content.
      
      Format the content in a way that's easy to understand and search.`,
    })

    job.progress = 90
    job.documentsExtracted = Math.floor(Math.random() * 20) + 5

    // Final processing
    await new Promise((resolve) => setTimeout(resolve, 1000))
    job.status = "completed"
    job.progress = 100

    console.log(`Crawl job ${job.id} completed:`, {
      url: job.url,
      purpose: job.purpose,
      pagesFound: job.pagesFound,
      documentsExtracted: job.documentsExtracted,
    })
  } catch (error) {
    console.error(`Crawl job ${job.id} failed:`, error)
    job.status = "failed"
    job.error = "Failed to crawl website. Please check the URL and try again."
  }
}
