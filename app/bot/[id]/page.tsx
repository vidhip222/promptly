"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Bot, FileText, Settings, BarChart3, Share, Zap, Trash2, Upload } from "lucide-react"
import Link from "next/link"

interface BotData {
  id: string
  name: string
  description: string
  department: string
  personality: string
  instructions: string
  status: "active" | "draft"
  documents: Array<{
    id: string
    name: string
    size: number
    uploadedAt: string
  }>
  analytics: {
    totalMessages: number
    avgResponseTime: number
    satisfactionScore: number
    topQuestions: Array<{ question: string; count: number }>
  }
}

export default function BotManagement({ params }: { params: { id: string } }) {
  const [botData, setBotData] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load bot data
    const loadBotData = async () => {
      try {
        // Mock data for demo
        const mockBotData: BotData = {
          id: params.id,
          name: "HR Assistant",
          description: "Helps employees with HR policies, benefits, and procedures",
          department: "Human Resources",
          personality: "Professional and empathetic",
          instructions: "Always be helpful and maintain confidentiality. Direct sensitive matters to HR directly.",
          status: "active",
          documents: [
            { id: "1", name: "Employee Handbook.pdf", size: 2.5, uploadedAt: "2024-01-15" },
            { id: "2", name: "Benefits Guide.docx", size: 1.8, uploadedAt: "2024-01-16" },
            { id: "3", name: "Leave Policies.pdf", size: 0.9, uploadedAt: "2024-01-17" },
          ],
          analytics: {
            totalMessages: 245,
            avgResponseTime: 1.2,
            satisfactionScore: 4.6,
            topQuestions: [
              { question: "How do I request time off?", count: 45 },
              { question: "What are my benefits?", count: 38 },
              { question: "How do I update my personal information?", count: 32 },
              { question: "What is the dress code policy?", count: 28 },
            ],
          },
        }

        setBotData(mockBotData)
      } catch (error) {
        console.error("Failed to load bot data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBotData()
  }, [params.id])

  const handleDeleteBot = async () => {
    if (confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
      try {
        // Mock delete
        alert("Bot deleted successfully!")
        window.location.href = "/"
      } catch (error) {
        console.error("Failed to delete bot:", error)
      }
    }
  }

  const handleSave = () => {
    alert("Bot settings saved successfully!")
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    alert(`Uploading ${files.length} files...`)
  }

  const removeDocument = async (docId: string) => {
    if (!botData) return

    setBotData((prev) =>
      prev
        ? {
            ...prev,
            documents: prev.documents.filter((doc) => doc.id !== docId),
          }
        : null,
    )

    alert("Document removed successfully!")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bot data...</p>
        </div>
      </div>
    )
  }

  if (!botData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Bot not found</p>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Badge variant={botData.status === "active" ? "default" : "secondary"}>{botData.status}</Badge>
              <Link href={`/chat/${botData.id}`}>
                <Button variant="outline" size="sm">
                  Test Chat
                </Button>
              </Link>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteBot}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Bot
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{botData.name}</h2>
          <p className="text-gray-600 mt-1">{botData.description}</p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="deploy" className="flex items-center space-x-2">
              <Share className="w-4 h-4" />
              <span>Deploy</span>
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Configure your bot's basic settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Bot Name</Label>
                    <Input
                      id="name"
                      value={botData.name}
                      onChange={(e) => setBotData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={botData.description}
                      onChange={(e) => setBotData((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={botData.department}
                      onChange={(e) => setBotData((prev) => (prev ? { ...prev, department: e.target.value } : null))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personality & Behavior</CardTitle>
                  <CardDescription>Define how your bot should interact</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="personality">Personality</Label>
                    <Input
                      id="personality"
                      value={botData.personality}
                      onChange={(e) => setBotData((prev) => (prev ? { ...prev, personality: e.target.value } : null))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Custom Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={botData.instructions}
                      onChange={(e) => setBotData((prev) => (prev ? { ...prev, instructions: e.target.value } : null))}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>Manage documents that your bot learns from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Upload additional documents (PDF, DOCX, TXT, CSV)</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                  />
                  <Label htmlFor="document-upload" className="cursor-pointer">
                    <Button variant="outline">Choose Files</Button>
                  </Label>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Current Documents</h3>
                  <div className="space-y-2">
                    {botData.documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-600">
                              {doc.size} MB • Uploaded {doc.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeDocument(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Messages</p>
                      <p className="text-3xl font-bold text-gray-900">{botData.analytics.totalMessages}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                      <p className="text-3xl font-bold text-gray-900">{botData.analytics.avgResponseTime}s</p>
                    </div>
                    <Bot className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                      <p className="text-3xl font-bold text-gray-900">{botData.analytics.satisfactionScore}/5</p>
                    </div>
                    <Settings className="w-8 h-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Documents</p>
                      <p className="text-3xl font-bold text-gray-900">{botData.documents.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Questions</CardTitle>
                <CardDescription>Most frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {botData.analytics.topQuestions.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{item.question}</span>
                      <Badge variant="secondary">{item.count} times</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deploy Tab */}
          <TabsContent value="deploy">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shareable Link</CardTitle>
                  <CardDescription>Create a public link for your bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Current Link:</p>
                    <p className="font-mono text-sm break-all">https://promptly.app/chat/{botData.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://promptly.app/chat/${botData.id}`)
                        alert("Link copied to clipboard!")
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Regenerate
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Website Widget</CardTitle>
                  <CardDescription>Embed your bot on your website</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Embed Code:</p>
                    <code className="text-xs block whitespace-pre-wrap">
                      {`<script src="https://promptly.app/widget.js"></script>
<div id="promptly-widget" data-bot-id="${botData.id}"></div>`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const embedCode = `<script src="https://promptly.app/widget.js"></script>\n<div id="promptly-widget" data-bot-id="${botData.id}"></div>`
                      navigator.clipboard.writeText(embedCode)
                      alert("Embed code copied to clipboard!")
                    }}
                  >
                    Copy Embed Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slack Integration</CardTitle>
                  <CardDescription>Add your bot to Slack workspace</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Connect your bot to Slack to allow team members to interact with it directly in channels.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => alert("Slack integration connected successfully!")}
                  >
                    Connect to Slack
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>Integrate via REST API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">API Endpoint:</p>
                    <p className="font-mono text-sm">POST https://api.promptly.app/v1/chat/{botData.id}</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    View API Docs
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
