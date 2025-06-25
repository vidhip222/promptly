import { type NextRequest, NextResponse } from "next/server"
import { createBillingPortalSession } from "@/lib/stripe"
// import { supabaseAdmin } from "@/lib/supabase" // No longer needed for mock

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    // In a real scenario, you would fetch the user's stripe_customer_id from your DB
    // const { data: user, error: userError } = await supabaseAdmin
    //   .from("users")
    //   .select("stripe_customer_id")
    //   .eq("id", userId)
    //   .single()
    // if (userError || !user) {
    //   return NextResponse.json({ error: "User not found" }, { status: 404 })
    // }
    // const customerId = user.stripe_customer_id;

    // For mock, use a dummy customer ID
    const customerId = `cus_mock_user_${userId || "test"}`

    // Create billing portal session using the mocked function
    const session = await createBillingPortalSession(customerId, `${process.env.NEXT_PUBLIC_APP_URL}/billing`)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Billing portal error (mocked):", error)
    return NextResponse.json({ error: "Failed to create billing portal session (mocked)" }, { status: 500 })
  }
}
