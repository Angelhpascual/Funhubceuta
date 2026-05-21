import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(20)

  const rows = data ?? []

  const upcoming = rows
    .filter(r => r.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))

  const results = rows
    .filter(r => r.status === 'finished')
    .sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ upcoming, results })
}
