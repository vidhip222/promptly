import { type NextRequest, NextResponse } from "next/server"
import { stripe, STRIPE_PLANS } from "@/lib/stripe" // Import STRIPE_PLANS
import { supabaseAdmin } from "@/lib/supabase"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get("stripe-signature")!

    let event: any

    try {
      // Use a dummy webhook secret for mock environment
      event = stripe.webhooks.constructEvent(body, signature, "whsec_mock_secret")
    } catch (err) {
      console.error("Webhook signature verification failed:", err)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionCanceled(event.data.object)
        break

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object)
        break

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true, message: "MOCK: Webhook received, no action taken." })
  } catch (error) {
    console.error("Webhook error (mocked):", error)
    return NextResponse.json({ error: "Webhook failed (mocked)" }, { status: 500 })
  }
}

async function handleSubscriptionChange(subscription: any) {
  const customerId = subscription.customer
  const subscriptionId = subscription.id
  const status = subscription.status
  const priceId = subscription.items.data[0].price.id

  // Map price ID to plan using STRIPE_PLANS
  let planId = "free"
  if (priceId === STRIPE_PLANS.pro.priceId) {
    planId = "pro"
  } else if (priceId === STRIPE_PLANS.enterprise.priceId) {
    planId = "enterprise"
  }

  // Update user subscription
  const { error: userError } = await supabaseAdmin
    .from("users")
    .update({ subscription_plan: planId })
    .eq("stripe_customer_id", customerId)

  if (userError) {
    console.error("Failed to update user subscription:", userError)
    return
  }

  // Upsert subscription record
  const { error: subError } = await supabaseAdmin.from("subscriptions").upsert({
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    plan_id: planId,
    status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  })

  if (subError) {
    console.error("Failed to upsert subscription:", subError)
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  const customerId = subscription.customer

  // Downgrade user to free plan
  const { error: userError } = await supabaseAdmin
    .from("users")
    .update({ subscription_plan: "free" })
    .eq("stripe_customer_id", customerId)

  if (userError) {
    console.error("Failed to downgrade user:", userError)
  }

  // Update subscription status
  const { error: subError } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled" })
    .eq("stripe_subscription_id", subscription.id)

  if (subError) {
    console.error("Failed to update subscription status:", subError)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  console.log("Payment succeeded for customer:", invoice.customer)
  // Could send success email or update payment status
}

async function handlePaymentFailed(invoice: any) {
  console.log("Payment failed for customer:", invoice.customer)
  // Could send failure email or suspend account
}
