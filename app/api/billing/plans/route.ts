import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    features: {
      bots: 2,
      messages: 100,
      documents: 5,
      storage: "10MB",
      support: "Community",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    interval: "month",
    features: {
      bots: 10,
      messages: 2000,
      documents: 50,
      storage: "1GB",
      support: "Email",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    interval: "month",
    features: {
      bots: "Unlimited",
      messages: "Unlimited",
      documents: "Unlimited",
      storage: "10GB",
      support: "Priority",
    },
  },
]

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ plans: PLANS })
  } catch (error) {
    console.error("Get plans error:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
