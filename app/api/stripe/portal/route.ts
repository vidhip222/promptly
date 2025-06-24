import { type NextRequest, NextResponse } from "next/server"
import { createBillingPortalSession } from "@/lib/stripe"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create billing portal session
    const session = await createBillingPortalSession(
      user.stripe_customer_id,
      `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Billing portal error:", error)
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 })
  }
}
