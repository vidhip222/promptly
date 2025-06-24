import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function createCustomer(email: string, name: string) {
  return await stripe.customers.create({
    email,
    name,
  })
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
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
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
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
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
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
