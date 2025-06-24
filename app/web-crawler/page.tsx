"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Globe, Zap, AlertCircle, CheckCircle, Loader2, Eye, Download, Bot } from "lucide-react"
import Link from "next/link"

interface CrawlJob {
  id: string
  url: string
  purpose: string
  status: "pending" | "crawling" | "processing" | "completed" | "failed"
  progress: number
  pagesFound: number
  documentsExtracted: number
  extractedContent?: string
  error?: string
}

export default function WebCrawler() {
  const [url, setUrl] = useState("")
  const [purpose, setPurpose] = useState("")
  const [selectedBotId, setSelectedBotId] = useState("")
  const [crawlJobs, setCrawlJobs] = useState<CrawlJob[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedJob, setSelectedJob] = useState<CrawlJob | null>(null)
  const [userBots, setUserBots] = useState([])

  // Load user's bots on component mount
  React.useEffect(() => {
    loadUserBots()
  }, [])

  const loadUserBots = async () => {
    try {
      const response = await fetch("/api/bots")
      if (response.ok) {
        const data = await response.json()
        setUserBots(data.bots || [])
      }
    } catch (error) {
      console.error("Failed to load bots:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !purpose.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/web-crawler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
          purpose: purpose.trim(),
        }),
      })

      if (response.ok) {
        const job = await response.json()
        setCrawlJobs((prev) => [job, ...prev])
        setUrl("")
        setPurpose("")

        // Start polling for updates
        pollJobStatus(job.id)
      } else {
        throw new Error("Failed to start crawling")
      }
    } catch (error) {
      console.error("Crawl error:", error)
      alert("Failed to start web crawling. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/web-crawler/${jobId}`)
        if (response.ok) {
          const updatedJob = await response.json()
          setCrawlJobs((prev) => prev.map((job) => (job.id === jobId ? updatedJob : job)))

          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            clearInterval(interval)
          }
        }
      } catch (error) {
        console.error("Polling error:", error)
        clearInterval(interval)
      }
    }, 2000)
  }

  const downloadAsPDF = async (job: CrawlJob) => {
    try {
      const response = await fetch("/api/web-crawler/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          content: job.extractedContent,
          url: job.url,
          purpose: job.purpose,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = `crawl-${job.id}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download PDF")
    }
  }

  const applyToBot = async (job: CrawlJob) => {
    if (!selectedBotId) {
      alert("Please select a bot first")
      return
    }

    try {
      const response = await fetch(`/api/bots/${selectedBotId}/apply-crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: job.id,
          content: job.extractedContent,
          url: job.url,
          purpose: job.purpose,
        }),
      })

      if (response.ok) {
        alert("Content successfully applied to bot!")
      } else {
        throw new Error("Failed to apply to bot")
      }
    } catch (error) {
      console.error("Apply to bot failed:", error)
      alert("Failed to apply content to bot")
    }
  }

  const getStatusIcon = (status: CrawlJob["status"]) => {
    switch (status) {
      case "pending":
      case "crawling":
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusColor = (status: CrawlJob["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "crawling":
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Web Crawler</h2>
          <p className="text-gray-600 mt-2">Extract content from websites to train your AI bots</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Crawl Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Start Web Crawl</span>
              </CardTitle>
              <CardDescription>
                Tell us what you want to crawl and why, and our AI will extract the relevant content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Enter the main URL - we'll crawl the entire site or specific sections
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">What do you want to extract?</Label>
                  <Textarea
                    id="purpose"
                    placeholder="e.g., Product documentation, FAQ content, company policies, technical guides..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Be specific about what content you need - our AI will focus on relevant pages
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting Crawl...
                    </>
                  ) : (
                    "Start Crawling"
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• AI analyzes your purpose and finds relevant pages</li>
                  <li>• Content is extracted and cleaned automatically</li>
                  <li>• Documents are processed and added to your bot's knowledge</li>
                  <li>• You can assign crawled content to specific bots</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Crawl Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Crawl Jobs</CardTitle>
              <CardDescription>Track your web crawling progress</CardDescription>
            </CardHeader>
            <CardContent>
              {crawlJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No crawl jobs yet</p>
                  <p className="text-sm">Start your first web crawl to see progress here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {crawlJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span className="font-medium truncate">{job.url}</span>
                        </div>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{job.purpose}</p>

                      {job.status !== "pending" && job.status !== "failed" && (
                        <div className="space-y-2">
                          <Progress value={job.progress} className="h-2" />
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>{job.pagesFound} pages found</span>
                            <span>{job.documentsExtracted} documents extracted</span>
                          </div>
                        </div>
                      )}

                      {job.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                          {job.error}
                        </div>
                      )}

                      {job.status === "completed" && (
                        <div className="mt-3 space-y-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedJob(job)}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Content</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadAsPDF(job)}
                              className="flex items-center space-x-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download PDF</span>
                            </Button>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a bot to apply content" />
                              </SelectTrigger>
                              <SelectContent>
                                {userBots.map((bot: any) => (
                                  <SelectItem key={bot.id} value={bot.id}>
                                    {bot.name} ({bot.department})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => applyToBot(job)}
                              disabled={!selectedBotId}
                              className="flex items-center space-x-1"
                            >
                              <Bot className="w-3 h-3" />
                              <span>Apply to Bot</span>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Viewer Modal */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extracted Content</CardTitle>
                    <CardDescription>{selectedJob.url}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedJob(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedJob.extractedContent || "No content available"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
