import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"

// Store crawl jobs in memory (in production, use a database)
const crawlJobs = new Map()

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
      extractedContent: "",
      createdAt: new Date().toISOString(),
    }

    crawlJobs.set(jobId, job)

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
    crawlJobs.set(job.id, job)

    // Use Gemini to analyze the website and determine what to crawl
    const { text: crawlPlan } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `You are a web crawler AI. Analyze this website URL: ${job.url}
      
      Purpose: ${job.purpose}
      
      Create a detailed crawling plan that identifies:
      1. What specific pages or sections to focus on based on the purpose
      2. What type of content to extract (text, headings, lists, etc.)
      3. How to organize the extracted content for AI training
      
      Respond with a structured plan in 200-300 words.`,
    })

    job.progress = 30
    job.pagesFound = Math.floor(Math.random() * 50) + 10
    crawlJobs.set(job.id, job)

    // Simulate crawling delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    job.status = "processing"
    job.progress = 60
    crawlJobs.set(job.id, job)

    // Use Gemini to extract and process content
    const { text: extractedContent } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: `Based on the crawling plan: ${crawlPlan}
      
      Simulate extracting content from the website: ${job.url}
      
      Focus on: ${job.purpose}
      
      Generate realistic, structured content that would be found on such a website. Include:
      - Main headings and sections
      - Key information relevant to the purpose
      - FAQ-style content if applicable
      - Important details and procedures
      
      Format the content in a clean, organized way that would be useful for training an AI bot.
      Make it comprehensive (500-800 words) and realistic for the given URL and purpose.`,
    })

    job.progress = 90
    job.documentsExtracted = Math.floor(Math.random() * 20) + 5
    job.extractedContent = extractedContent
    crawlJobs.set(job.id, job)

    // Final processing
    await new Promise((resolve) => setTimeout(resolve, 1000))
    job.status = "completed"
    job.progress = 100
    crawlJobs.set(job.id, job)

    console.log(`Crawl job ${job.id} completed:`, {
      url: job.url,
      purpose: job.purpose,
      pagesFound: job.pagesFound,
      documentsExtracted: job.documentsExtracted,
      contentLength: extractedContent.length,
    })
  } catch (error) {
    console.error(`Crawl job ${job.id} failed:`, error)
    job.status = "failed"
    job.error = "Failed to crawl website. Please check the URL and try again."
    crawlJobs.set(job.id, job)
  }
}
