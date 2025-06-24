import { createBrowserClient, createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

/* ----------------------------- Public client (browser) ----------------------------- */
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!publicUrl || !publicKey) {
  throw new Error("Missing Supabase public environment variables.")
}

let supabaseSingleton: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseSingleton) {
    supabaseSingleton = createClient(publicUrl, publicKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
    console.log("✅ Supabase client initialized (singleton)")
  }
  return supabaseSingleton
}

/* ---------------------------- Admin client (server) ---------------------------- */
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(
        process.env.SUPABASE_URL ?? "",
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        {
          auth: { autoRefreshToken: false, persistSession: false },
        }
      )
    : null

export const supabase = getSupabaseClient()
