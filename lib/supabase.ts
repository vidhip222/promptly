"use client"

/**
 * Centralised Supabase helpers
 *
 * – `supabase`        Anonymous client (browser + server) – uses the *public* anon key.
 * – `supabaseAdmin`   Service-role client (server only). Falls back to the anon client
 *                     in preview/dev when `SUPABASE_SERVICE_ROLE_KEY` is absent so that
 *                     API routes don’t crash.
 *
 * Both clients are singletons to prevent duplicate websocket connections or
 * repeated initialisation.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Environment helpers
// ---------------------------------------------------------------------------
// Use process.env directly as Vercel injects these at runtime/build time
const PUBLIC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PUBLIC_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY // Server-only key

// Ensure public variables are always defined for the client
const supabaseUrl = PUBLIC_URL ?? "https://placeholder.supabase.co"
const supabaseAnonKey = PUBLIC_ANON ?? "public-anon-key"

// ---------------------------------------------------------------------------
// Supabase Client Instances
// ---------------------------------------------------------------------------

// Public (browser + server) client
// This client uses the public anon key and is safe for client-side use.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Service-role (server-only) client
// This client uses the service role key for elevated privileges.
// If the service key is not available (e.g., in client-side code or preview without the key),
// it falls back to the anonymous client to prevent crashes, but with limited permissions.
export const supabaseAdmin: SupabaseClient = (() => {
  // In a browser environment, or if the service key is missing,
  // fall back to the public client.
  if (typeof window !== "undefined" || !SERVICE_KEY) {
    if (typeof window === "undefined" && !SERVICE_KEY) {
      console.warn(
        "[supabase] SUPABASE_SERVICE_ROLE_KEY not set. Falling back to anon client for server-side admin operations.",
      )
    } else if (typeof window !== "undefined") {
      console.warn(
        "[supabase] supabaseAdmin should ideally not be used on the client side. Falling back to anon client.",
      )
    }
    return supabase // Fallback to the anon client
  }

  // If SERVICE_KEY is present and we are on the server, create the service role client.
  return createClient(supabaseUrl, SERVICE_KEY)
})()
