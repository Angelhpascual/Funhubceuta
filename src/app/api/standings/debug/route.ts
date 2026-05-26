import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const steps: Record<string, unknown> = {}

  // Step 1: fetch ESPN
  try {
    const res = await fetch('https://site.api.espn.com/apis/v2/sports/soccer/esp.2/standings', { cache: 'no-store' })
    steps.espn_status = res.status
    if (res.ok) {
      const data = await res.json()
      const entries = data?.children?.[0]?.standings?.entries ?? []
      steps.espn_entries = entries.length
      if (entries.length > 0) {
        const first = entries[0]
        steps.espn_first_team = first.team?.displayName
        steps.espn_first_stats_count = first.stats?.length
      }
    }
  } catch (err) {
    steps.espn_error = err instanceof Error ? err.message : String(err)
  }

  // Step 2: supabase read
  try {
    const { supabase } = await import('@/infrastructure/supabase/client')
    const { data, error } = await supabase.from('standings').select('count').limit(1)
    steps.supabase_ok = !error
    steps.supabase_error = error?.message
    steps.supabase_data = data
  } catch (err) {
    steps.supabase_error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(steps)
}
