"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Upload, FileText, Bot, Zap, Trash2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CreateBot() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [botData, setBotData] = useState({
    name: "",
    description: "",
    department: "",
    personality: "",
    instructions: "",
    documents: [] as File[],
  })

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
      } else {
        setUser(user)
      }
    }
    checkAuth()
  }, [router])

  const departments = [
    "Human Resources",
    "Information Technology",
    "Sales",
    "Marketing",
    "Customer Support",
    "Finance",
    "Operations",
    "Legal",
  ]

  const personalities = [
    { value: "professional", label: "Professional", description: "Formal and business-oriented" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable" },
    { value: "helpful", label: "Helpful", description: "Solution-focused and supportive" },
    { value: "concise", label: "Concise", description: "Brief and to-the-point" },
    { value: "detailed", label: "Detailed", description: "Thorough and comprehensive" },
  ]

  // FIXED: File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    console.log("📄 Files selected:", files.length)
    setBotData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }))
    // Clear the input so same file can be selected again
    event.target.value = ""
  }

  const removeDocument = (index: number) => {
    setBotData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!user) {
      alert("Please log in to create a bot")
      return
    }

    if (!botData.name || !botData.description) {
      alert("Please fill in the required fields")
      return
    }

    if (botData.documents.length === 0) {
      alert("Please upload at least one document for your bot to learn from")
      return
    }

    setIsCreating(true)

    try {
      console.log("Creating bot for user:", user.id)

      // Create bot first
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: botData.name,
          description: botData.description,
          department: botData.department,
          personality: botData.personality,
          instructions: botData.instructions,
          status: "draft", // Start as draft until documents are processed
        }),
      })

      const responseData = await response.json()
      console.log("Bot creation response:", responseData)

      if (response.ok && responseData.bot) {
        const botId = responseData.bot.id

        // Upload documents
        console.log("Uploading", botData.documents.length, "documents...")
        let successfulUploads = 0

        for (const file of botData.documents) {
          try {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("botId", botId)
            formData.append("userId", user.id)

            const uploadResponse = await fetch("/api/documents/upload", {
              method: "POST",
              body: formData,
            })

            if (uploadResponse.ok) {
              successfulUploads++
              console.log("✅ Uploaded:", file.name)
            } else {
              console.error("❌ Failed to upload:", file.name)
            }
          } catch (uploadError) {
            console.error("Upload error for", file.name, uploadError)
          }
        }

        if (successfulUploads > 0) {
          // Activate bot after successful document uploads
          await fetch(`/api/bots/${botId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "active",
            }),
          })

          console.log("✅ Bot activated with", successfulUploads, "documents")
          router.push(`/bot/${botId}`)
        } else {
          throw new Error("No documents were uploaded successfully")
        }
      } else {
        throw new Error(responseData.error || "Failed to create bot")
      }
    } catch (error) {
      console.error("Bot creation error:", error)
      alert(`Failed to create bot: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNumber ? "bg-blue-600" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 && "Bot Configuration"}
              {step === 2 && "Upload Documents"}
              {step === 3 && "Review & Deploy"}
            </h2>
            <p className="text-gray-600 mt-1">
              {step === 1 && "Define your bot's personality and purpose"}
              {step === 2 && "Upload documents for your bot to learn from (Required)"}
              {step === 3 && "Review your settings and deploy your bot"}
            </p>
          </div>
        </div>

        {/* Step 1: Bot Configuration */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5" />
                <span>Bot Configuration</span>
              </CardTitle>
              <CardDescription>Set up your bot's basic information and personality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Bot Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., HR Assistant"
                    value={botData.name}
                    onChange={(e) => setBotData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={botData.department}
                    onValueChange={(value) => setBotData((prev) => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your bot will help with..."
                  value={botData.description}
                  onChange={(e) => setBotData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <Label>Personality</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {personalities.map((personality) => (
                    <div
                      key={personality.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        botData.personality === personality.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setBotData((prev) => ({ ...prev, personality: personality.value }))}
                    >
                      <div className="font-medium">{personality.label}</div>
                      <div className="text-sm text-gray-600">{personality.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
                <Textarea
                  id="instructions"
                  placeholder="Any specific instructions for how your bot should behave..."
                  value={botData.instructions}
                  onChange={(e) => setBotData((prev) => ({ ...prev, instructions: e.target.value }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!botData.name || !botData.description}>
                  Next: Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Document Upload - FIXED */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Upload Documents (Required)</span>
              </CardTitle>
              <CardDescription>
                Upload documents that your bot will use to answer questions. At least one document is required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload your documents</p>
                  <p className="text-gray-600">Supports PDF, DOCX, TXT, and CSV files up to 10MB each</p>
                </div>
                {/* FIXED: File input */}
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <Button
                  className="mt-4"
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                  type="button"
                >
                  Choose Files
                </Button>
              </div>

              {botData.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Uploaded Documents ({botData.documents.length})</h3>
                  <div className="space-y-2">
                    {botData.documents.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => removeDocument(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={botData.documents.length === 0}>
                  Next: Review & Deploy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Deploy */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Deploy</CardTitle>
              <CardDescription>Review your bot configuration and deploy it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Bot Information</h3>
                    <div className="mt-2 space-y-1">
                      <p>
                        <span className="text-gray-600">Name:</span> {botData.name}
                      </p>
                      <p>
                        <span className="text-gray-600">Department:</span> {botData.department || "General"}
                      </p>
                      <p>
                        <span className="text-gray-600">Personality:</span> {botData.personality || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">Description</h3>
                    <p className="mt-1 text-gray-600">{botData.description}</p>
                  </div>

                  {botData.instructions && (
                    <div>
                      <h3 className="font-medium text-gray-900">Custom Instructions</h3>
                      <p className="mt-1 text-gray-600">{botData.instructions}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">Documents ({botData.documents.length})</h3>
                  <div className="mt-2 space-y-2">
                    {botData.documents.map((file, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-600" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Deployment Process</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. Create bot with your configuration</p>
                  <p>2. Upload and process all documents</p>
                  <p>3. Train bot on document content</p>
                  <p>4. Activate bot for use</p>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating}>
                  {isCreating ? "Creating Bot..." : "Deploy Bot"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
