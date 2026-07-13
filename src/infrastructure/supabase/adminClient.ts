import { createClient } from '@supabase/supabase-js'

const isDevelop = process.env.VERCEL_ENV === 'preview'
const supabaseUrl = (isDevelop
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_DEVELOP
  : process.env.NEXT_PUBLIC_SUPABASE_URL) ?? 'https://placeholder.supabase.co'
const serviceRoleKey = (isDevelop
  ? process.env.SUPABASE_SERVICE_ROLE_KEY_DEVELOP
  : process.env.SUPABASE_SERVICE_ROLE_KEY) ?? 'placeholder'

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
