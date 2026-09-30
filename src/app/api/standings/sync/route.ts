import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { ESPN_STANDINGS as ESPN, STANDINGS_CURRENT_SEASON as CURRENT_SEASON } from '@/lib/constants'
import { logCron } from '@/infrastructure/supabase/logCron'

function getDescription(position: number, total: number): string {
  if (position <= 2) return 'Promotion'
  if (position <= 6) return 'Promotion Playoff'
  if (position >= total - 3) return 'Relegation'
  return ''
}

async function syncFromEspn(season: string) {
  const res = await fetchWithTimeout(ESPN, { cache: 'no-store' }, 15_000)
  if (!res.ok) throw new Error(`ESPN responded ${res.status}`)

  const data = await res.json()
  const entries: unknown[] = data?.children?.[0]?.standings?.entries ?? []
  if (!entries.length) throw new Error('ESPN returned 0 entries')

  const rows = entries.map((e: unknown, i: number) => {
    const entry = e as Record<string, unknown>
    const team = entry.team as Record<string, unknown>
    const stats = (entry.stats as Record<string, unknown>[]).reduce<Record<string, number>>(
      (acc, s) => {
        if (s.value !== undefined) acc[s.name as string] = Number(s.value) || 0
        return acc
      },
      {}
    )

    const logos = team.logos as Record<string, unknown>[] | undefined
    const logoUrl = (logos?.[0]?.href as string) ?? null

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
  await teamsRepo.upsertTeams(rows.map((r) => ({ name: r.teamName, logoUrl: r.teamLogo, season })))

  const { supabase } = await import('@/infrastructure/supabase/client')
  const { setConfig } = await import('@/infrastructure/supabase/AppConfigRepository')
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('result, date')
    .eq('status', 'finished')
    .not('result', 'is', null)
    .order('date', { ascending: false })
    .limit(5)

  if (finishedMatches && finishedMatches.length > 0) {
    const form = finishedMatches
      .map((m) => m.result)
      .reverse()
      .join(',')
    await setConfig('ceuta_form', form)
  }

  return rows.length
}

async function syncFromEspnSafe() {
  const t0 = Date.now()
  try {
    const count = await syncFromEspn(CURRENT_SEASON)
    await logCron('standings-sync', 'success', Date.now() - t0, { teams: count })
    return count
  } catch (err) {
    await logCron('standings-sync', 'error', Date.now() - t0, { error: String(err) })
    throw err
  }
}

// Two legitimate callers hit this in production, neither of which is a
// browser: the QStash schedule (signs every request — verified below) and
// the admin panel's "Sincronizar clasificación" button, which calls this
// directly with `?secret=` (no QStash signature, same as other
// callDirect-triggered crons). Accept either; reject everything else.
// (Previously this check ran but never acted on its result, leaving POST
// effectively unauthenticated for anyone.)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const hasValidSecret = secret === process.env.TEST_SECRET

  if (process.env.NODE_ENV === 'production' && !hasValidSecret) {
    const receiver = new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    })
    const body = await request.text()
    const valid = await receiver
      .verify({ signature: request.headers.get('Upstash-Signature') ?? '', body })
      .catch(() => false)
    if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await syncFromEspnSafe()
    return NextResponse.json({ ok: true, teams: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
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
    const count = await syncFromEspnSafe()
    return NextResponse.json({ ok: true, teams: count })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
