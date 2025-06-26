"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Bot, FileText, MessageSquare, Settings, Zap, LogOut, CreditCard, Users, Crown } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase-client"

interface ChatBot {
  id: string
  name: string
  description: string
  department: string
  documentsCount: number
  messagesCount: number
  status: "active" | "draft"
  createdAt: string
  template?: string
}

interface User {
  id: string
  email: string
  name: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [bots, setBots] = useState<ChatBot[]>([])
  const [loadingBots, setLoadingBots] = useState(false)

  useEffect(() => {
    // Check for guest mode first
    const guestMode = localStorage.getItem("promptly_guest_mode")
    if (guestMode === "true") {
      const guestUser = localStorage.getItem("promptly_guest_user")
      if (guestUser) {
        setUser(JSON.parse(guestUser))
        setIsGuest(true)
        loadGuestBots()
        setLoading(false)
        return
      }
    }

    // Check authentication status
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUser({
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || user.email || "",
          })
          await loadUserBots(user.id)
        } else {
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

  const loadGuestBots = () => {
    const guestBots: ChatBot[] = [
      {
        id: "1",
        name: "HR Assistant",
        description: "Helps employees with HR policies, benefits, and procedures",
        department: "Human Resources",
        documentsCount: 12,
        messagesCount: 245,
        status: "active",
        createdAt: "2024-01-15",
        template: "hr",
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
        template: "it",
      },
      {
        id: "3",
        name: "Legal Assistant",
        description: "Legal document review and compliance guidance",
        department: "Legal",
        documentsCount: 15,
        messagesCount: 89,
        status: "active",
        createdAt: "2024-01-20",
        template: "legal",
      },
    ]
    setBots(guestBots)
  }

  const loadUserBots = async (userId: string) => {
    setLoadingBots(true)
    try {
      const response = await fetch(`/api/bots?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBots(data.bots || [])
      }
    } catch (error) {
      console.error("Failed to load bots:", error)
    } finally {
      setLoadingBots(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (isGuest) {
        localStorage.removeItem("promptly_guest_mode")
        localStorage.removeItem("promptly_guest_user")
        window.location.href = "/auth/login"
      } else {
        await supabase.auth.signOut()
        window.location.href = "/auth/login"
      }
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
              {isGuest && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Demo Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name || user?.email}</span>
              {!isGuest && (
                <>
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
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                {isGuest ? "Exit Demo" : "Logout"}
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
        {/* Demo Notice */}
        {isGuest && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">You're in Demo Mode!</p>
                  <p className="text-sm text-green-700">
                    Explore all features with sample data.
                    <Link href="/auth/signup" className="underline ml-1">
                      Sign up
                    </Link>{" "}
                    to save your work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                    {bots.reduce((sum, bot) => sum + (bot.documentsCount || 0), 0)}
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
                    {bots.reduce((sum, bot) => sum + (bot.messagesCount || 0), 0)}
                  </p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bots Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Chatbots</h2>
            {loadingBots && <div className="text-sm text-gray-600">Loading bots...</div>}
          </div>

          {bots.length === 0 && !loadingBots ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bots yet</h3>
                <p className="text-gray-600 mb-4">Create your first AI bot to get started</p>
                <Link href="/create-bot">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Bot
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        {bot.template && (
                          <Badge variant="outline" className="text-xs">
                            {bot.template.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant={bot.status === "active" ? "default" : "secondary"}>{bot.status}</Badge>
                      </div>
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
                        <span className="font-medium">{bot.documentsCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Messages:</span>
                        <span className="font-medium">{bot.messagesCount || 0}</span>
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
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/create-bot">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <Plus className="w-6 h-6" />
                  <span>Create New Bot</span>
                </Button>
              </Link>
              <Link href="/templates">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <Bot className="w-6 h-6" />
                  <span>Bot Templates</span>
                </Button>
              </Link>
              <Link href="/web-crawler">
                <Button variant="outline" className="w-full h-20 flex-col space-y-2">
                  <FileText className="w-6 h-6" />
                  <span>Web Crawler</span>
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
