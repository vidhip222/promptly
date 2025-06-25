import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession, STRIPE_PLANS } from "@/lib/stripe"
// import { supabaseAdmin } from "@/lib/supabase" // No longer needed for mock

export async function POST(request: NextRequest) {
  try {
    const { planId, userId } = await request.json() // Changed priceId to planId for clarity

    // In a real scenario, you would fetch the user's stripe_customer_id from your DB
    // const { data: user, error: userError } = await supabaseAdmin
    //   .from("users")
    //   .select("stripe_customer_id, email")
    //   .eq("id", userId)
    //   .single()
    // if (userError || !user) {
    //   return NextResponse.json({ error: "User not found" }, { status: 404 })
    // }
    // const customerId = user.stripe_customer_id;

    // For mock, use a dummy customer ID and get the priceId from STRIPE_PLANS
    const customerId = `cus_mock_user_${userId || "test"}`
    const priceId = STRIPE_PLANS[planId as keyof typeof STRIPE_PLANS]?.priceId

    if (!priceId) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    // Create checkout session using the mocked function
    const session = await createCheckoutSession(
      customerId,
      priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Stripe checkout error (mocked):", error)
    return NextResponse.json({ error: "Failed to create checkout session (mocked)" }, { status: 500 })
  }
}
