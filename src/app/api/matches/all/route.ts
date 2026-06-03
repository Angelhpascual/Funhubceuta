import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'

export async function GET() {
  const { data } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(60)

  const rows = data ?? []
  type Row = typeof rows[0]

  // Deduplicate by date+home+away, keeping row with result
  const deduped = Object.values(
    rows.reduce<Record<string, Row>>((acc, r) => {
      const key = `${String(r.date).slice(0, 10)}_${r.home_team}_${r.away_team}`
      if (!acc[key] || (!acc[key].result && r.result)) acc[key] = r
      return acc
    }, {})
  ) as Row[]

  const today = new Date().toISOString().split('T')[0]

  const upcoming = deduped
    .filter(r => r.status === 'scheduled' && String(r.date).slice(0, 10) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const results = deduped
    .filter(r => r.status === 'finished' || (r.status === 'scheduled' && String(r.date).slice(0, 10) < today))
    .sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({ upcoming, results })
}
