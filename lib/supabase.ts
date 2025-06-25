import { createClient } from "@supabase/supabase-js"

const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!publicUrl || !publicKey) {
  throw new Error("Missing Supabase public environment variables.")
}

// ✅ SINGLE Supabase instance, module-scoped
const supabase = createClient(publicUrl, publicKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})

export { supabase } // ✅ named export only (no default export)
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
