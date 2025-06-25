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

const SERVICE_KEY =
  typeof window === "undefined"
    ? process.env.SUPABASE_SERVICE_ROLE_KEY // server-only
    : undefined

function invariant(name: string, value: unknown) {
  if (!value) {
    console.warn(`[supabase] Missing environment variable ${name}`)
  }
}

// Validate required public vars (we warn, no hard crash so UI previews keep working)
invariant("NEXT_PUBLIC_SUPABASE_URL", PUBLIC_URL)
invariant("NEXT_PUBLIC_SUPABASE_ANON_KEY", PUBLIC_ANON)
if (typeof window === "undefined") {
  // Only warn for service key on server
  invariant("SUPABASE_SERVICE_ROLE_KEY", SERVICE_KEY)
}

// ---------------------------------------------------------------------------
// Singleton creators
// ---------------------------------------------------------------------------
const globalAny = globalThis as unknown as {
  __supabase?: SupabaseClient
  __supabaseAdmin?: SupabaseClient
}

function createAnonClient(): SupabaseClient {
  // Even if the envs are undefined we still create a dummy client so imports never break.
  return createClient(PUBLIC_URL ?? "https://placeholder.supabase.co", PUBLIC_ANON ?? "public-anon-key")
}

function createServiceRoleClient(): SupabaseClient {
  // If the secure key is missing we gracefully fall back to anon.
  if (!SERVICE_KEY) {
    console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY not set – falling back to anon client")
    return supabase // Fallback to the anon client
  }
  // Ensure PUBLIC_URL is defined for the service role client
  if (!PUBLIC_URL) {
    console.error(
      "[supabase] PUBLIC_URL is missing for service role client. This should not happen if NEXT_PUBLIC_SUPABASE_URL is set.",
    )
    return supabase // Fallback if URL is unexpectedly missing
  }
  return createClient(PUBLIC_URL, SERVICE_KEY)
}

// Public (browser + server) client
export const supabase = globalAny.__supabase ?? (globalAny.__supabase = createAnonClient())

// Service-role (server) client
export const supabaseAdmin = globalAny.__supabaseAdmin ?? (globalAny.__supabaseAdmin = createServiceRoleClient())
