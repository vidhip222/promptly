import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)

    // Mock subscription data
    const subscription = {
      id: "sub_123",
      userId: user.id,
      planId: "free",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usage: {
        bots: 2,
        messages: 45,
        documents: 8,
        storage: "2.5MB",
      },
      limits: {
        bots: 2,
        messages: 100,
        documents: 5,
        storage: "10MB",
      },
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error("Get subscription error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId } = await request.json()

    // In production:
    // 1. Create Stripe checkout session
    // 2. Handle payment processing
    // 3. Update user subscription
    // 4. Send confirmation email

    return NextResponse.json({
      success: true,
      checkoutUrl: `https://checkout.stripe.com/pay/mock-session-${planId}`,
      message: "Subscription upgrade initiated",
    })
  } catch (error) {
    console.error("Upgrade subscription error:", error)
    return NextResponse.json({ error: "Failed to upgrade subscription" }, { status: 500 })
  }
}
