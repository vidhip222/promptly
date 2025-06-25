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
import {
  ArrowLeft,
  Bot,
  FileText,
  Settings,
  BarChart3,
  Share,
  Zap,
  Trash2,
  Upload,
  AlertCircle,
  RefreshCw,
} from "lucide-react" // Added RefreshCw icon
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

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
    file_size: number
    created_at: string
    status: string
  }>
  analytics: {
    totalMessages: number
    avgResponseTime: number
    satisfactionScore: number
    topQuestions: Array<{ question: string; count: number }>
  }
}

export default function BotManagement({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [botData, setBotData] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [retraining, setRetraining] = useState(false) // New state for retraining

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setUser(user)
        loadBotData()
      }
    }
    checkAuth()
  }, [router])

  const loadBotData = async () => {
    try {
      const response = await fetch(`/api/bots/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.bot) {
          // Load real analytics
          const analyticsResponse = await fetch(`/api/analytics?botId=${params.id}`)
          let analytics = {
            totalMessages: 0,
            avgResponseTime: 1.23,
            satisfactionScore: 4.5,
            topQuestions: [],
          }

          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            analytics = {
              totalMessages: analyticsData.totalMessages || 0,
              avgResponseTime: Math.round((analyticsData.avgResponseTime || 1.23) * 100) / 100,
              satisfactionScore: Math.round((analyticsData.satisfactionScore || 4.5) * 100) / 100,
              topQuestions: analyticsData.topQuestions || [],
            }
          }

          setBotData({
            ...data.bot,
            documents: data.bot.documents || [],
            analytics,
          })
        }
      }
    } catch (error) {
      console.error("Failed to load bot data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBot = async () => {
    if (!confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/bots/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Bot deleted successfully!")
        router.push("/")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete bot")
      }
    } catch (error) {
      console.error("Failed to delete bot:", error)
      alert(`Failed to delete bot: ${error.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!botData) return

    try {
      const response = await fetch(`/api/bots/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: botData.name,
          description: botData.description,
          department: botData.department,
          personality: botData.personality,
          instructions: botData.instructions,
        }),
      })

      if (response.ok) {
        alert("Bot settings saved successfully!")
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save bot:", error)
      alert("Failed to save settings")
    }
  }

  const handleRetrainBot = async () => {
    if (!botData) return

    setRetraining(true)
    try {
      const response = await fetch(`/api/bots/${params.id}/retrain`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message || "Bot retraining initiated!")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to initiate retraining")
      }
    } catch (error) {
      console.error("Failed to retrain bot:", error)
      alert(`Failed to retrain bot: ${error.message}`)
    } finally {
      setRetraining(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0 || !user) return

    setUploading(true)

    try {
      for (const file of files) {
        console.log(`📄 Uploading: ${file.name}`)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("botId", params.id)
        formData.append("userId", user.id)

        const response = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        console.log("Upload result:", result)

        if (response.ok) {
          // Add document to local state
          if (botData && result.document) {
            setBotData((prev) =>
              prev
                ? {
                    ...prev,
                    documents: [
                      ...prev.documents,
                      {
                        id: result.document.id,
                        name: result.document.name,
                        file_size: result.document.file_size,
                        created_at: result.document.created_at,
                        status: result.document.status,
                      },
                    ],
                  }
                : null,
            )
          }
          alert(`✅ ${result.fileName} uploaded successfully!`)
        } else {
          throw new Error(result.error || "Upload failed")
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert(`❌ Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
      // Clear the input
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const removeDocument = async (docId: string) => {
    if (!botData) return

    if (!confirm("Are you sure you want to remove this document?")) {
      return
    }

    try {
      const response = await fetch(`/api/bots/${params.id}/documents/${docId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBotData((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((doc) => doc.id !== docId),
              }
            : null,
        )
        alert("Document removed successfully!")
      } else {
        throw new Error("Failed to remove document")
      }
    } catch (error) {
      console.error("Failed to remove document:", error)
      alert("Failed to remove document")
    }
  }

  const currentUrl = typeof window !== "undefined" ? window.location.origin : "https://promptlyco.vercel.app"

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
              {/* New Retrain Button */}
              <Button size="sm" onClick={handleRetrainBot} disabled={retraining}>
                <RefreshCw className="w-4 h-4 mr-2" />
                {retraining ? "Retraining..." : "Retrain Bot"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDeleteBot} disabled={deleting}>
                <Trash2 className="w-4 h-4 mr-2" />
                {deleting ? "Deleting..." : "Delete Bot"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px:6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">{botData.name}</h2>
          <p className="text-gray-600 mt-1">{botData.description}</p>
        </div>

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
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

          {/* Documents Tab - Now First */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  Upload documents that your bot will use to answer questions. The bot will ONLY answer based on these
                  documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {botData.documents.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800 font-medium">No documents uploaded</p>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Your bot needs documents to answer questions. Upload relevant files to get started.
                    </p>
                  </div>
                )}

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">
                    Upload documents (PDF, DOCX, TXT, CSV, JPG, PNG) - Max 10MB each
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.csv,.jpg,.jpeg,.png" // Updated accepted file types
                    onChange={handleFileUpload}
                    className="hidden"
                    id="document-upload"
                    disabled={uploading}
                  />
                  <Label htmlFor="document-upload" className="cursor-pointer">
                    <Button variant="outline" disabled={uploading} asChild>
                      <span>{uploading ? "Uploading..." : "Choose Files"}</span>
                    </Button>
                  </Label>
                </div>

                {botData.documents.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium">Current Documents ({botData.documents.length})</h3>
                    <div className="space-y-2">
                      {botData.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-600">
                                {(doc.file_size / 1024 / 1024).toFixed(2)} MB •
                                <Badge
                                  variant={
                                    doc.status === "completed"
                                      ? "default"
                                      : doc.status === "failed"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                  className="ml-2"
                                >
                                  {doc.status}
                                </Badge>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                    <p className="text-xs text-gray-600">
                      Note: Bot will only answer questions based on uploaded documents
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                      <p className="text-3xl font-bold text-gray-900">
                        {botData.analytics.avgResponseTime.toFixed(2)}s
                      </p>
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
                      <p className="text-3xl font-bold text-gray-900">
                        {botData.analytics.satisfactionScore.toFixed(2)}/5
                      </p>
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
                {botData.analytics.topQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {botData.analytics.topQuestions.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.question}</span>
                        <Badge variant="secondary">{item.count} times</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-4">No questions asked yet</p>
                )}
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
                    <p className="font-mono text-sm break-all">
                      {currentUrl}/chat/{botData.id}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigator.clipboard.writeText(`${currentUrl}/chat/${botData.id}`)
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
                      {`<script src="${currentUrl}/widget.js"></script>
<div id="promptly-widget" data-bot-id="${botData.id}"></div>`}
                    </code>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const embedCode = `<script src="${currentUrl}/widget.js"></script>\n<div id="promptly-widget" data-bot-id="${botData.id}"></div>`
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
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/slack/connect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            botId: botData.id,
                            workspaceId: "demo-workspace",
                            accessToken: "demo-token",
                            teamName: "Demo Team",
                          }),
                        })
                        if (response.ok) {
                          alert("✅ Slack integration connected successfully!")
                        } else {
                          throw new Error("Failed to connect")
                        }
                      } catch (error) {
                        alert("❌ Slack integration failed. Please try again.")
                      }
                    }}
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
                    <p className="font-mono text-sm">POST {currentUrl}/api/chat</p>
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
