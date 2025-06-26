"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Bot, Shield, Briefcase, Headphones, DollarSign, Zap, Check, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"

interface Template {
  id: string
  name: string
  description: string
  department: string
  icon: React.ReactNode
  personality: string
  instructions: string
  tone: string
  goal: string
  features: string[]
  sampleDocuments: string[]
  documentsIncluded: number
  popular: boolean
  color: string
}

export default function Templates() {
  const router = useRouter()
  const [creatingBot, setCreatingBot] = useState<string | null>(null)

  const templates: Template[] = [
    {
      id: "hr-assistant",
      name: "HR Assistant",
      description: "Complete HR support for employee questions about policies, benefits, and procedures",
      department: "Human Resources",
      icon: <Users className="w-6 h-6" />,
      personality: "Professional, empathetic, and confidential",
      instructions:
        "You are an HR assistant specializing in Human Resources. ONLY answer questions based on uploaded HR documents. If asked about topics not covered in your documents, respond: 'I don't have information about that in my current HR documents. Please upload relevant HR documents or contact HR directly.' Always maintain confidentiality and direct sensitive matters to human HR representatives.",
      tone: "Professional yet approachable",
      goal: "Help employees with HR-related questions while maintaining confidentiality",
      features: [
        "Employee handbook guidance",
        "Benefits explanation",
        "Leave policy assistance",
        "Performance review info",
      ],
      sampleDocuments: ["Employee Handbook.pdf", "Benefits Guide.docx", "Leave Policies.pdf", "Code of Conduct.pdf"],
      documentsIncluded: 0, // Templates start with 0 documents - user uploads their own
      popular: true,
      color: "bg-blue-500",
    },
    {
      id: "it-support",
      name: "IT Support Bot",
      description: "Technical support for common IT issues, software help, and troubleshooting",
      department: "Information Technology",
      icon: <Bot className="w-6 h-6" />,
      personality: "Technical, patient, and solution-oriented",
      instructions:
        "You are an IT support specialist. ONLY provide solutions based on uploaded IT documentation and manuals. If asked about issues not covered in your documents, respond: 'I don't have information about that in my current IT documents. Please upload relevant technical documentation or contact IT support directly.' Provide step-by-step troubleshooting guidance and escalate complex issues when needed.",
      tone: "Technical but easy to understand",
      goal: "Resolve common IT issues and guide users through technical problems",
      features: [
        "Troubleshooting guides",
        "Software installation help",
        "Security best practices",
        "Hardware diagnostics",
      ],
      sampleDocuments: [
        "IT Troubleshooting Guide.pdf",
        "Software Manuals.docx",
        "Security Policies.pdf",
        "Hardware Specs.xlsx",
      ],
      documentsIncluded: 0,
      popular: true,
      color: "bg-green-500",
    },
    {
      id: "legal-bot",
      name: "Legal & Compliance Bot",
      description: "Legal and compliance guidance for regulations and company policies",
      department: "Legal & Compliance",
      icon: <Shield className="w-6 h-6" />,
      personality: "Precise, cautious, and detail-oriented",
      instructions:
        "You are a legal compliance assistant. ONLY provide information based on uploaded legal documents and compliance materials. If asked about matters not covered in your documents, respond: 'I don't have information about that in my current legal documents. Please upload relevant legal documentation or consult with legal professionals directly.' Always remind users that this is not legal advice and they should consult with legal professionals for complex matters.",
      tone: "Formal and precise",
      goal: "Provide compliance guidance while emphasizing the need for professional legal consultation",
      features: ["Regulatory compliance", "Policy interpretation", "Legal document guidance", "Audit preparation"],
      sampleDocuments: [
        "Compliance Manual.pdf",
        "Legal Policies.docx",
        "Regulatory Guidelines.pdf",
        "Audit Checklist.xlsx",
      ],
      documentsIncluded: 0,
      popular: false,
      color: "bg-purple-500",
    },
    {
      id: "customer-support",
      name: "Customer Support",
      description: "Customer service assistant for product questions and support tickets",
      department: "Customer Support",
      icon: <Headphones className="w-6 h-6" />,
      personality: "Friendly, helpful, and customer-focused",
      instructions:
        "You are a customer support representative. ONLY answer questions based on uploaded product documentation, FAQs, and support materials. If asked about topics not covered in your documents, respond: 'I don't have information about that in my current support documents. Please upload relevant product documentation or contact our support team directly.' Be friendly and helpful, focus on solving customer problems quickly.",
      tone: "Friendly and solution-focused",
      goal: "Provide excellent customer service and resolve issues efficiently",
      features: ["Product information", "Order assistance", "Return policies", "Technical support"],
      sampleDocuments: ["Product Catalog.pdf", "FAQ Database.docx", "Return Policy.pdf", "Support Procedures.pdf"],
      documentsIncluded: 0,
      popular: false,
      color: "bg-orange-500",
    },
    {
      id: "sales-assistant",
      name: "Sales Assistant",
      description: "Sales support for product information, pricing, and lead qualification",
      department: "Sales",
      icon: <DollarSign className="w-6 h-6" />,
      personality: "Persuasive, knowledgeable, and results-driven",
      instructions:
        "You are a sales assistant. ONLY provide information based on uploaded sales materials, product catalogs, and pricing documents. If asked about topics not covered in your documents, respond: 'I don't have information about that in my current sales documents. Please upload relevant sales materials or contact our sales team directly.' Help qualify leads, provide product information, and guide prospects through the sales process.",
      tone: "Professional and persuasive",
      goal: "Support the sales process and help convert leads into customers",
      features: ["Product demonstrations", "Pricing information", "Lead qualification", "Sales process guidance"],
      sampleDocuments: ["Product Catalog.pdf", "Pricing Sheets.xlsx", "Sales Scripts.docx", "Competitor Analysis.pdf"],
      documentsIncluded: 0,
      popular: false,
      color: "bg-yellow-500",
    },
    {
      id: "operations-helper",
      name: "Operations Helper",
      description: "Operational procedures and process documentation assistant",
      department: "Operations",
      icon: <Briefcase className="w-6 h-6" />,
      personality: "Systematic, detail-oriented, and process-focused",
      instructions:
        "You are an operations assistant. ONLY provide guidance based on uploaded operational procedures, process documentation, and workflow materials. If asked about processes not covered in your documents, respond: 'I don't have information about that in my current operations documents. Please upload relevant process documentation or contact the operations team directly.' Help users understand processes and procedures, ensure compliance with operational standards.",
      tone: "Clear and systematic",
      goal: "Ensure smooth operations by providing process guidance and documentation",
      features: ["Process documentation", "Standard operating procedures", "Quality control", "Workflow optimization"],
      sampleDocuments: [
        "Operations Manual.pdf",
        "Process Documentation.docx",
        "Quality Guidelines.pdf",
        "Safety Protocols.pdf",
      ],
      documentsIncluded: 0,
      popular: false,
      color: "bg-indigo-500",
    },
  ]

  const handleUseTemplate = async (template: Template) => {
    setCreatingBot(template.id)

    try {
      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        alert("Please log in to create a bot")
        router.push("/auth/login")
        return
      }

      console.log("Creating bot for user:", user.id)

      // Create bot with template data
      const response = await fetch("/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: template.name,
          description: template.description,
          department: template.department,
          personality: template.personality,
          instructions: template.instructions,
          tone: template.tone,
          goal: template.goal,
          template_id: template.id,
          status: "active",
        }),
      })

      const responseData = await response.json()
      console.log("Bot creation response:", responseData)

      if (response.ok && responseData.bot) {
        // Redirect to bot management page where user can upload their own documents
        router.push(`/bot/${responseData.bot.id}`)
      } else {
        throw new Error(responseData.error || "Failed to create bot")
      }
    } catch (error) {
      console.error("Error creating bot:", error)
      alert(`Failed to create bot: ${error.message}`)
    } finally {
      setCreatingBot(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Bot Templates</h2>
          <p className="text-gray-600 mt-2">Get started quickly with pre-configured bots for specific departments</p>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <p className="text-blue-800 font-medium">Templates come ready to customize</p>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Each template creates a specialized bot. You'll upload your own documents to train it with your specific
              content.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center text-white`}
                    >
                      {template.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-gray-600">{template.department}</p>
                    </div>
                  </div>
                  {template.popular && <Badge className="bg-orange-100 text-orange-800">Popular</Badge>}
                </div>
                <CardDescription className="mt-3">{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Pre-configured with:</h4>
                    <ul className="space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <Check className="w-3 h-3 text-green-600 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Personality:</p>
                    <p className="text-sm font-medium">{template.personality}</p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700 mb-1">📄 Documents:</p>
                    <p className="text-sm text-yellow-800">Upload your own documents after creation</p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                    disabled={creatingBot === template.id}
                  >
                    {creatingBot === template.id ? "Creating Bot..." : "Use This Template"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Need a Custom Bot?</h3>
              <p className="text-gray-600 mb-6">
                Create a completely custom bot from scratch with your own documents and configuration.
              </p>
              <Link href="/create-bot">
                <Button variant="outline" size="lg">
                  Create Custom Bot
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
