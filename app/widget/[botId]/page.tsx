"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Send, Minimize2, Maximize2 } from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  sources?: string[]
}

interface BotConfig {
  id: string
  name: string
  description: string
  personality: string
  primaryColor: string
  greeting: string
}

export default function ChatWidget({ params }: { params: { botId: string } }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)

  useEffect(() => {
    // Load bot configuration
    loadBotConfig()
    // Add initial greeting
    addGreetingMessage()
  }, [])

  const loadBotConfig = async () => {
    try {
      const response = await fetch(`/api/widget/${params.botId}/config`)
      if (response.ok) {
        const config = await response.json()
        setBotConfig(config)
      }
    } catch (error) {
      console.error("Failed to load bot config:", error)
      // Fallback config
      setBotConfig({
        id: params.botId,
        name: "Assistant",
        description: "AI Assistant",
        personality: "helpful",
        primaryColor: "#3B82F6",
        greeting: "Hello! How can I help you today?",
      })
    }
  }

  const addGreetingMessage = () => {
    const greeting: Message = {
      id: "greeting",
      content: botConfig?.greeting || "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    }
    setMessages([greeting])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch(`/api/widget/${params.botId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          history: messages.slice(-10), // Send last 10 messages for context
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.response,
          role: "assistant",
          timestamp: new Date(),
          sources: data.sources,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error("Failed to get response")
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  if (!botConfig) {
    return (
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-lg border flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div
      className={`fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-80 h-96"
      }`}
      style={{ zIndex: 1000 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 rounded-t-lg text-white cursor-pointer"
        style={{ backgroundColor: botConfig.primaryColor }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-medium">{botConfig.name}</h3>
            <p className="text-xs opacity-90">{botConfig.description}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </Button>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-64">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-2 ${message.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    message.role === "user" ? "bg-gray-200 text-gray-600" : "text-white"
                  }`}
                  style={{
                    backgroundColor: message.role === "assistant" ? botConfig.primaryColor : undefined,
                  }}
                >
                  {message.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                    message.role === "user" ? "bg-gray-100 text-gray-900" : "text-white"
                  }`}
                  style={{
                    backgroundColor: message.role === "assistant" ? botConfig.primaryColor : undefined,
                  }}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: botConfig.primaryColor }}
                >
                  <Bot className="w-3 h-3" />
                </div>
                <div className="px-3 py-2 rounded-lg text-white" style={{ backgroundColor: botConfig.primaryColor }}>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                    <div
                      className="w-1 h-1 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-sm"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !input.trim()}
                style={{ backgroundColor: botConfig.primaryColor }}
              >
                <Send className="w-3 h-3" />
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
