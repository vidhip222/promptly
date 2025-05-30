"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, User, Send, Zap } from "lucide-react"
import Link from "next/link"

interface BotInfo {
  id: string
  name: string
  department: string
  personality: string
  status: "active" | "draft"
}

export default function ChatInterface({ params }: { params: { id: string } }) {
  const [botInfo] = useState<BotInfo>({
    id: params.id,
    name: "HR Assistant",
    department: "Human Resources",
    personality: "Professional and helpful",
    status: "active",
  })

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `Hello! I'm your ${botInfo.name}. I'm here to help you with ${botInfo.department.toLowerCase()} related questions. How can I assist you today?`,
        parts: [
          {
            type: "text",
            text: `Hello! I'm your ${botInfo.name}. I'm here to help you with ${botInfo.department.toLowerCase()} related questions. How can I assist you today?`,
          },
        ],
      },
    ],
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </Link>
            <div className="flex items-center space-x-3">
              <Badge variant={botInfo.status === "active" ? "default" : "secondary"}>{botInfo.status}</Badge>
              <span className="text-sm text-gray-600">{botInfo.name}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span>{botInfo.name}</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              {botInfo.department} • {botInfo.personality}
            </p>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div key={`${message.id}-${i}`} className="space-y-2">
                            <div className="whitespace-pre-wrap">{part.text}</div>
                            {/* Show citations for assistant messages */}
                            {message.role === "assistant" && part.text.includes("According to") && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <p className="font-medium text-gray-700">Sources:</p>
                                <p className="text-gray-600">• Employee Handbook.pdf</p>
                                <p className="text-gray-600">• Benefits Guide.docx</p>
                              </div>
                            )}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Share Bot</h3>
              <p className="text-sm text-gray-600 mb-3">Get a shareable link</p>
              <Button variant="outline" size="sm">
                Generate Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Export Chat</h3>
              <p className="text-sm text-gray-600 mb-3">Download conversation</p>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <h3 className="font-medium mb-2">Bot Settings</h3>
              <p className="text-sm text-gray-600 mb-3">Manage configuration</p>
              <Link href={`/bot/${botInfo.id}`}>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
