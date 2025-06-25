import Stripe from "stripe"

// Mock Stripe instance - real API calls will not be made
export const stripe = new Stripe("sk_test_mock_key", {
  apiVersion: "2023-10-16",
})

export async function createCustomer(email: string, name: string) {
  console.log(`MOCK: Creating Stripe customer for ${email}`)
  return {
    id: `cus_mock_${Math.random().toString(36).substring(7)}`,
    email,
    name,
  } as Stripe.Customer
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  console.log(`MOCK: Creating Stripe checkout session for customer ${customerId} with price ${priceId}`)
  return {
    id: `cs_mock_${Math.random().toString(36).substring(7)}`,
    url: `${successUrl}?mock_session_id=true`, // Return a dummy URL
  } as Stripe.Checkout.Session
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  console.log(`MOCK: Creating Stripe billing portal session for customer ${customerId}`)
  return {
    id: `bps_mock_${Math.random().toString(36).substring(7)}`,
    url: `${returnUrl}?mock_portal_id=true`, // Return a dummy URL
  } as Stripe.BillingPortal.Session
}

export const STRIPE_PLANS = {
  free: {
    name: "Free",
    price: "$0",
    features: ["1 bot", "10 documents", "100 messages/month", "Basic support"],
    limits: {
      bots: 1,
      documents: 10,
      messages: 100,
    },
  },
  pro: {
    name: "Pro",
    price: "$29",
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_mock_pro", // Use mock ID if not set
    features: ["10 bots", "100 documents", "10,000 messages/month", "Slack integration", "Priority support"],
    limits: {
      bots: 10,
      documents: 100,
      messages: 10000,
    },
  },
  enterprise: {
    name: "Enterprise",
    price: "$99",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_mock_enterprise", // Use mock ID if not set
    features: [
      "Unlimited bots",
      "Unlimited documents",
      "Unlimited messages",
      "Custom integrations",
      "Dedicated support",
      "SSO",
    ],
    limits: {
      bots: -1, // unlimited
      documents: -1,
      messages: -1,
    },
  },
}
