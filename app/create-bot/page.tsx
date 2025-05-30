"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Upload, FileText, Bot, Zap } from "lucide-react"
import Link from "next/link"

export default function CreateBot() {
  const [step, setStep] = useState(1)
  const [botData, setBotData] = useState({
    name: "",
    description: "",
    department: "",
    personality: "",
    instructions: "",
    documents: [] as File[],
  })

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setBotData((prev) => ({
      ...prev,
      documents: [...prev.documents, ...files],
    }))
  }

  const removeDocument = (index: number) => {
    setBotData((prev) => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    // Here you would typically send the data to your API
    console.log("Creating bot with data:", botData)
    // Redirect to bot management page
    window.location.href = "/"
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
              {step === 2 && "Upload documents for your bot to learn from"}
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
                  <Label htmlFor="name">Bot Name</Label>
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
                <Label htmlFor="description">Description</Label>
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
                <Button onClick={() => setStep(2)} disabled={!botData.name || !botData.department}>
                  Next: Upload Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Upload Documents</span>
              </CardTitle>
              <CardDescription>Upload documents that your bot will use to answer questions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Upload your documents</p>
                  <p className="text-gray-600">Supports PDF, DOCX, TXT, and CSV files up to 10MB each</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button className="mt-4">Choose Files</Button>
                </Label>
              </div>

              {botData.documents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">Uploaded Documents</h3>
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
                          Remove
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
                <Button onClick={() => setStep(3)}>Next: Review & Deploy</Button>
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
                        <span className="text-gray-600">Department:</span> {botData.department}
                      </p>
                      <p>
                        <span className="text-gray-600">Personality:</span> {botData.personality}
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
                  <h3 className="font-medium text-gray-900">Documents</h3>
                  <div className="mt-2 space-y-2">
                    {botData.documents.length === 0 ? (
                      <p className="text-gray-600">No documents uploaded</p>
                    ) : (
                      botData.documents.map((file, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-900 mb-3">Deployment Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Chat Interface</h4>
                    <p className="text-sm text-gray-600 mt-1">Direct chat on your dashboard</p>
                    <Badge className="mt-2">Included</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Shareable Link</h4>
                    <p className="text-sm text-gray-600 mt-1">Public link for external access</p>
                    <Badge className="mt-2">Included</Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Website Widget</h4>
                    <p className="text-sm text-gray-600 mt-1">Embed on your website</p>
                    <Badge variant="secondary" className="mt-2">
                      Coming Soon
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSubmit}>Deploy Bot</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
