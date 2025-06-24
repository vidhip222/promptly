"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BarChart3, Bot, MessageSquare, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

interface AnalyticsData {
  totalBots: number
  totalMessages: number
  totalDocuments: number
  avgResponseTime: number
  topBots: Array<{
    id: string
    name: string
    messages: number
    satisfaction: number
  }>
  recentActivity: Array<{
    id: string
    type: "message" | "bot_created" | "document_uploaded"
    description: string
    timestamp: string
  }>
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Check if user is authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          // Load guest analytics
          const guestAnalytics: AnalyticsData = {
            totalBots: 3,
            totalMessages: 490,
            totalDocuments: 35,
            avgResponseTime: 1.2,
            topBots: [
              { id: "1", name: "HR Assistant", messages: 245, satisfaction: 4.6 },
              { id: "2", name: "IT Support Bot", messages: 156, satisfaction: 4.4 },
              { id: "3", name: "Legal Assistant", messages: 89, satisfaction: 4.8 },
            ],
            recentActivity: [
              {
                id: "1",
                type: "message",
                description: "User asked about vacation policy",
                timestamp: "2024-01-25T10:30:00Z",
              },
              {
                id: "2",
                type: "document_uploaded",
                description: "New employee handbook uploaded",
                timestamp: "2024-01-25T09:15:00Z",
              },
              {
                id: "3",
                type: "bot_created",
                description: "Legal Assistant bot created",
                timestamp: "2024-01-24T16:45:00Z",
              },
            ],
          }
          setAnalytics(guestAnalytics)
          setUser({ email: "demo@example.com" })
        } else {
          setUser(user)
          // Load real user analytics
          const response = await fetch(`/api/analytics?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            setAnalytics(data)
          } else {
            // Fallback to empty analytics
            setAnalytics({
              totalBots: 0,
              totalMessages: 0,
              totalDocuments: 0,
              avgResponseTime: 0,
              topBots: [],
              recentActivity: [],
            })
          }
        }
      } catch (error) {
        console.error("Failed to load analytics:", error)
        setAnalytics({
          totalBots: 0,
          totalMessages: 0,
          totalDocuments: 0,
          avgResponseTime: 0,
          topBots: [],
          recentActivity: [],
        })
      } finally {
        setLoading(false)
      }
    }

    loadAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load analytics</p>
          <Link href="/">
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Home</button>
          </Link>
        </div>
      </div>
    )
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
              <h1 className="text-2xl font-bold text-gray-900">Promptly Analytics</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-2">Track your AI bot performance and usage</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Bots</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalBots}</p>
                </div>
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Messages</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalMessages}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.avgResponseTime}s</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Performing Bots */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Bots</CardTitle>
              <CardDescription>Bots with the most activity and highest satisfaction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topBots.map((bot, index) => (
                  <div key={bot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{bot.name}</p>
                        <p className="text-sm text-gray-600">{bot.messages} messages</p>
                      </div>
                    </div>
                    <Badge variant="outline">{bot.satisfaction}/5 ⭐</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest actions across your workspace</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {activity.type === "message" && <MessageSquare className="w-4 h-4 text-gray-600" />}
                      {activity.type === "bot_created" && <Bot className="w-4 h-4 text-gray-600" />}
                      {activity.type === "document_uploaded" && <FileText className="w-4 h-4 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
