"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, FileText, MessageSquare, Settings, Zap, LogOut, CreditCard, Users } from "lucide-react"
import Link from "next/link"

interface ChatBot {
  id: string
  name: string
  description: string
  department: string
  documentsCount: number
  messagesCount: number
  status: "active" | "draft"
  createdAt: string
}

interface User {
  id: string
  email: string
  name: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [bots] = useState<ChatBot[]>([
    {
      id: "1",
      name: "HR Assistant",
      description: "Helps employees with HR policies, benefits, and procedures",
      department: "Human Resources",
      documentsCount: 12,
      messagesCount: 245,
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "IT Support Bot",
      description: "Technical support for common IT issues and software help",
      department: "Information Technology",
      documentsCount: 8,
      messagesCount: 156,
      status: "active",
      createdAt: "2024-01-10",
    },
    {
      id: "3",
      name: "Sales Assistant",
      description: "Product information and sales process guidance",
      department: "Sales",
      documentsCount: 5,
      messagesCount: 89,
      status: "draft",
      createdAt: "2024-01-20",
    },
  ])

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          // Redirect to login if not authenticated
          window.location.href = "/auth/login"
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        window.location.href = "/auth/login"
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (loading) {
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
              <Link href="/billing">
                <Button variant="outline" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </Button>
              </Link>
              <Link href="/workspace">
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-2" />
                  Workspace
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Link href="/create-bot">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bot
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bots</p>
                  <p className="text-3xl font-bold text-gray-900">{bots.length}</p>
                </div>
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Bots</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {bots.filter((bot) => bot.status === "active").length}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {bots.reduce((sum, bot) => sum + bot.documentsCount, 0)}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {bots.reduce((sum, bot) => sum + bot.messagesCount, 0)}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bots Grid */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Chatbots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <Card key={bot.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <Badge variant={bot.status === "active" ? "default" : "secondary"}>{bot.status}</Badge>
                  </div>
                  <CardDescription>{bot.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{bot.department}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-medium">{bot.documentsCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Messages:</span>
                      <span className="font-medium">{bot.messagesCount}</span>
                    </div>
                    <div className="flex space-x-2 pt-2">
                      <Link href={`/chat/${bot.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </Link>
                      <Link href={`/bot/${bot.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/create-bot">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <Plus className="w-6 h-6" />
                  <span>Create New Bot</span>
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <Bot className="w-6 h-6" />
                  <span>Browse Templates</span>
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <MessageSquare className="w-6 h-6" />
                  <span>View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
