import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { deduplicateMatches } from '../deduplicateMatches'

export async function GET() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(60)

  const rows = data ?? []

  const deduped = deduplicateMatches(rows)

  const today = new Date().toISOString().split('T')[0]

  const upcoming = deduped
    .filter((r) => r.status === 'scheduled' && String(r.date).slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const results = deduped
    .filter(
      (r) =>
        r.status === 'finished' || (r.status === 'scheduled' && String(r.date).slice(0, 10) < today)
    )
    .sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ upcoming, results })
}
