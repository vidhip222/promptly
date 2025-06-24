import { type NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId } = await request.json()

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create checkout session
    const session = await createCheckoutSession(
      user.stripe_customer_id,
      priceId,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    )

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
