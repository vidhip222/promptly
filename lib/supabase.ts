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
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Ensure these are always valid strings, even if env vars are missing
// Provide a fallback URL and key that are guaranteed to be strings,
// even if they are just placeholders.
const SUPABASE_URL = PUBLIC_URL || "https://dummy.supabase.co"
const SUPABASE_ANON_KEY = PUBLIC_ANON || "dummy-anon-key"

// ---------------------------------------------------------------------------
// Supabase Client Instances
// ---------------------------------------------------------------------------

// Public (browser + server) client
// This client uses the public anon key and is safe for client-side use.
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Service-role (server-only) client
// This client uses the service role key for elevated privileges.
// If the service key is not available (e.g., in client-side code or preview without the key),
// it falls back to the anonymous client to prevent crashes, but with limited permissions.
export const supabaseAdmin: SupabaseClient = (() => {
  // If we are on the client side (browser), or if the actual service key is not provided,
  // we fall back to using the public anon key for the "admin" client.
  // This prevents crashes but means operations will be limited by RLS.
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
    // Return the public client instance.
    // This ensures it's always a valid SupabaseClient with 'from' method.
    return supabase
  }

  // If the actual SERVICE_KEY is present and we are on the server, create the service role client.
  // We use SUPABASE_URL here, which is guaranteed to be a string.
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
})()
