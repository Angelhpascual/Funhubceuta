import { NextResponse } from 'next/server'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'

const ESPN = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.2/standings'

function getDescription(position: number, total: number): string {
  if (position <= 2) return 'Promotion'
  if (position <= 6) return 'Promotion Playoff'
  if (position >= total - 3) return 'Relegation'
  return ''
}

async function syncFromEspn(season: string) {
  const res = await fetch(ESPN, { cache: 'no-store' })
  if (!res.ok) throw new Error(`ESPN responded ${res.status}`)

  const data = await res.json()
  const entries: unknown[] = data?.children?.[0]?.standings?.entries ?? []
  if (!entries.length) throw new Error('ESPN returned 0 entries')

  const rows = entries.map((e: unknown, i: number) => {
    const entry = e as Record<string, unknown>
    const team = entry.team as Record<string, unknown>
    const stats = (entry.stats as Record<string, unknown>[]).reduce((acc, s) => {
      if (s.value !== undefined) acc[s.name as string] = Number(s.value) || 0
      return acc
    }, {} as Record<string, number>)

    const logos = team.logos as Record<string, unknown>[] | undefined
    const logoUrl = logos?.[0]?.href as string ?? null

    return {
      externalId: `${season}-${i + 1}`,
      season,
      position: i + 1,
      teamName: team.displayName as string,
      teamLogo: logoUrl,
      played: Math.round(Number(stats.gamesPlayed) || 0),
      won: Math.round(Number(stats.wins) || 0),
      drawn: Math.round(Number(stats.ties) || 0),
      lost: Math.round(Number(stats.losses) || 0),
      goalsFor: Math.round(Number(stats.pointsFor) || 0),
      goalsAgainst: Math.round(Number(stats.pointsAgainst) || 0),
      goalDifference: Math.round(Number(stats.pointDifferential) || 0),
      points: Math.round(Number(stats.points) || 0),
      form: null,
      description: getDescription(i + 1, entries.length),
    }
  })

  const repo = new StandingsSupabaseRepository()
  const teamsRepo = new TeamsSupabaseRepository()

  await repo.upsertEntries(rows)
  await teamsRepo.upsertTeams(rows.map(r => ({ name: r.teamName, logoUrl: r.teamLogo, season })))

  // Sync Ceuta form from finished matches in DB
  const { supabase } = await import('@/infrastructure/supabase/client')
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('result, date')
    .eq('status', 'finished')
    .not('result', 'is', null)
    .order('date', { ascending: false })
    .limit(5)

  if (finishedMatches && finishedMatches.length > 0) {
    const form = finishedMatches.map(m => m.result).reverse().join(',')
    await supabase.from('app_config').upsert(
      { key: 'ceuta_form', value: form, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  }

  return rows.length
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
      // Allow QStash calls (no secret needed for scheduled calls)
    }
    const count = await syncFromEspn('2025-2026')
    return NextResponse.json({ ok: true, teams: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[standings/sync]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Use POST in production' }, { status: 405 })
  }
  try {
    const count = await syncFromEspn('2025-2026')
    return NextResponse.json({ ok: true, teams: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
