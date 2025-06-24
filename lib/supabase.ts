import { createClient } from "@supabase/supabase-js"

/* -------------------------------------------------------------------------- */
/*                              Type-safe Database                             */
/* -------------------------------------------------------------------------- */
/* If you have a generated Database type from `supabase gen types`, import it.
   Otherwise you can delete the import below or keep `any`.              */
// import type { Database } from "./database-types"
type Database = any

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

export const supabase = createClient<Database>(publicUrl, publicKey, {
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
    ? createClient<Database>(process.env.SUPABASE_URL ?? "", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null
