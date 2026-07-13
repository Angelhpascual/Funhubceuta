import { createClient } from '@supabase/supabase-js'

const isDevelop = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
const supabaseUrl = (isDevelop
  ? process.env.NEXT_PUBLIC_SUPABASE_URL_DEVELOP
  : process.env.NEXT_PUBLIC_SUPABASE_URL) ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = (isDevelop
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOP
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
