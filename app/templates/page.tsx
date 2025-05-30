"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, Users, Headphones, DollarSign, Shield, Briefcase, Zap } from "lucide-react"
import Link from "next/link"

interface Template {
  id: string
  name: string
  description: string
  department: string
  icon: React.ReactNode
  features: string[]
  documentsIncluded: number
  popular: boolean
}

export default function Templates() {
  const templates: Template[] = [
    {
      id: "hr-assistant",
      name: "HR Assistant",
      description: "Complete HR support for employee questions about policies, benefits, and procedures",
      department: "Human Resources",
      icon: <Users className="w-6 h-6" />,
      features: ["Employee handbook", "Benefits guide", "Leave policies", "Performance reviews"],
      documentsIncluded: 12,
      popular: true,
    },
    {
      id: "it-support",
      name: "IT Support Bot",
      description: "Technical support for common IT issues, software help, and troubleshooting",
      department: "Information Technology",
      icon: <Bot className="w-6 h-6" />,
      features: ["Troubleshooting guides", "Software manuals", "Security policies", "Hardware specs"],
      documentsIncluded: 8,
      popular: true,
    },
    {
      id: "customer-support",
      name: "Customer Support",
      description: "Customer service assistant for product questions and support tickets",
      department: "Customer Support",
      icon: <Headphones className="w-6 h-6" />,
      features: ["Product documentation", "FAQ database", "Return policies", "Contact procedures"],
      documentsIncluded: 15,
      popular: false,
    },
    {
      id: "sales-assistant",
      name: "Sales Assistant",
      description: "Sales support for product information, pricing, and lead qualification",
      department: "Sales",
      icon: <DollarSign className="w-6 h-6" />,
      features: ["Product catalogs", "Pricing sheets", "Sales scripts", "Competitor analysis"],
      documentsIncluded: 10,
      popular: false,
    },
    {
      id: "compliance-bot",
      name: "Compliance Bot",
      description: "Legal and compliance guidance for regulations and company policies",
      department: "Legal",
      icon: <Shield className="w-6 h-6" />,
      features: ["Regulatory documents", "Compliance checklists", "Legal policies", "Audit procedures"],
      documentsIncluded: 6,
      popular: false,
    },
    {
      id: "operations-helper",
      name: "Operations Helper",
      description: "Operational procedures and process documentation assistant",
      department: "Operations",
      icon: <Briefcase className="w-6 h-6" />,
      features: ["Process documentation", "Standard procedures", "Quality guidelines", "Safety protocols"],
      documentsIncluded: 9,
      popular: false,
    },
  ]

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
          <p className="text-gray-600 mt-2">Get started quickly with pre-configured bots for common use cases</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
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
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Includes:</h4>
                    <ul className="space-y-1">
                      {template.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Documents:</span>
                    <span className="font-medium">{template.documentsIncluded} included</span>
                  </div>

                  <Link href={`/create-bot?template=${template.id}`} className="block">
                    <Button className="w-full">Use This Template</Button>
                  </Link>
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
