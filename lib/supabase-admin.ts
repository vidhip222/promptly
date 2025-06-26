import { createClient } from "@supabase/supabase-js"

if (typeof window !== "undefined") {
  throw new Error("[supabaseAdmin] This client must not be imported in the browser.")
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
)
