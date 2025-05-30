"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, Zap, CreditCard, Users, FileText, MessageSquare, HardDrive } from "lucide-react"
import Link from "next/link"

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  features: {
    bots: number | string
    messages: number | string
    documents: number | string
    storage: string
    support: string
  }
}

interface Subscription {
  id: string
  planId: string
  status: string
  usage: {
    bots: number
    messages: number
    documents: number
    storage: string
  }
  limits: {
    bots: number
    messages: number
    documents: number
    storage: string
  }
}

export default function Billing() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([fetch("/api/billing/plans"), fetch("/api/billing/subscription")])

        if (plansRes.ok && subRes.ok) {
          const plansData = await plansRes.json()
          const subData = await subRes.json()
          setPlans(plansData.plans)
          setSubscription(subData)
        }
      } catch (error) {
        console.error("Failed to fetch billing data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpgrade = async (planId: string) => {
    try {
      const response = await fetch("/api/billing/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.checkoutUrl, "_blank")
      }
    } catch (error) {
      console.error("Upgrade failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-gray-600">Loading billing information...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Promptly</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Billing & Subscription</h2>
          <p className="text-gray-600 mt-2">Manage your subscription and view usage</p>
        </div>

        {/* Current Usage */}
        {subscription && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Current Usage</span>
              </CardTitle>
              <CardDescription>
                Your current plan: <Badge>{plans.find((p) => p.id === subscription.planId)?.name}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Bots</span>
                    <span className="text-sm text-gray-600">
                      {subscription.usage.bots} / {subscription.limits.bots}
                    </span>
                  </div>
                  <Progress value={(subscription.usage.bots / subscription.limits.bots) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Messages</span>
                    <span className="text-sm text-gray-600">
                      {subscription.usage.messages} / {subscription.limits.messages}
                    </span>
                  </div>
                  <Progress value={(subscription.usage.messages / subscription.limits.messages) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Documents</span>
                    <span className="text-sm text-gray-600">
                      {subscription.usage.documents} / {subscription.limits.documents}
                    </span>
                  </div>
                  <Progress value={(subscription.usage.documents / subscription.limits.documents) * 100} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Storage</span>
                    <span className="text-sm text-gray-600">
                      {subscription.usage.storage} / {subscription.limits.storage}
                    </span>
                  </div>
                  <Progress value={25} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.id === "pro" ? "border-blue-500 shadow-lg" : ""}`}>
                {plan.id === "pro" && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold">
                    ${plan.price}
                    <span className="text-lg font-normal text-gray-600">/{plan.interval}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{plan.features.bots} bots</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{plan.features.messages} messages/month</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{plan.features.documents} documents</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <HardDrive className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{plan.features.storage} storage</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{plan.features.support} support</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={plan.id === subscription?.planId ? "outline" : "default"}
                    disabled={plan.id === subscription?.planId}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {plan.id === subscription?.planId ? "Current Plan" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your recent transactions and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Free Plan</p>
                  <p className="text-sm text-gray-600">Current billing period</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">$0.00</p>
                  <p className="text-sm text-gray-600">Jan 1 - Jan 31, 2024</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
