import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  const { data } = await supabase
    .from('tweets')
    .select('*')
    .order('created_at_twitter', { ascending: false })
    .limit(5)

  return NextResponse.json({ tweets: data ?? [] })
}
