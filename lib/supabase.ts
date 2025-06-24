import { createClient } from "@supabase/supabase-js"

/* -------------------------------------------------------------------------- */
/*                          Browser (public) client                           */
/* -------------------------------------------------------------------------- */

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!publicUrl || !publicKey) {
  throw new Error(
    "Supabase env vars missing: please add NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY to your project settings.",
  )
}

export const supabase = createClient(publicUrl, publicKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

/* -------------------------------------------------------------------------- */
/*                          Server-side (admin) client                         */
/* -------------------------------------------------------------------------- */

export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null
