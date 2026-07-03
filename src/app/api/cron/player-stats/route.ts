import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { logCron } from '@/infrastructure/supabase/logCron'
import { upsertPlayerStats, PlayerStatRow } from '@/infrastructure/supabase/PlayerStatsRepository'
import { ESPN_ROSTER, CURRENT_SEASON } from '@/lib/constants'

const POSITION_GROUP: Record<string, string> = {
  G: 'Porteros',
  D: 'Defensas',
  M: 'Centrocampistas',
  F: 'Delanteros',
}

interface EspnStat {
  name: string
  value: number
}
interface EspnCategory {
  name: string
  stats: EspnStat[]
}
interface EspnAthlete {
  id: string
  displayName: string
  shortName: string
  position: { abbreviation: string; displayName: string }
  jersey?: string
  headshot?: { href: string }
  statistics?: { splits?: { categories?: EspnCategory[] } }
}

function getStat(categories: EspnCategory[], name: string): number {
  for (const cat of categories) {
    const s = cat.stats.find((s) => s.name === name)
    if (s) return s.value ?? 0
  }
  return 0
}

async function scrapePlayerStats() {
  const t0 = Date.now()
  try {
    const res = await fetch(ESPN_ROSTER, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`ESPN responded ${res.status}`)

    const data = await res.json()
    const athletes: EspnAthlete[] = data.athletes ?? []

    const rows: PlayerStatRow[] = athletes
      .filter((a) => a.statistics?.splits?.categories)
      .map((a) => {
        const cats = a.statistics!.splits!.categories!
        const posAbbr = a.position?.abbreviation ?? 'M'
        return {
          espn_id: a.id,
          season: CURRENT_SEASON,
          name: a.displayName,
          short_name: a.shortName,
          position: a.position?.displayName ?? '',
          position_group: POSITION_GROUP[posAbbr] ?? 'Centrocampistas',
          photo_url: a.headshot?.href ?? null,
          appearances: Math.round(getStat(cats, 'appearances')),
          goals: Math.round(getStat(cats, 'totalGoals')),
          assists: Math.round(getStat(cats, 'goalAssists')),
          shots: Math.round(getStat(cats, 'totalShots')),
          shots_on_target: Math.round(getStat(cats, 'shotsOnTarget')),
          yellow_cards: Math.round(getStat(cats, 'yellowCards')),
          red_cards: Math.round(getStat(cats, 'redCards')),
          saves: Math.round(getStat(cats, 'saves')),
          goals_conceded: Math.round(getStat(cats, 'goalsConceded')),
          updated_at: new Date().toISOString(),
        }
      })

    if (rows.length === 0) throw new Error('No athletes with stats found')

    await upsertPlayerStats(rows)

    await logCron('player-stats', 'success', Date.now() - t0, {
      updated: rows.length,
      season: CURRENT_SEASON,
    })
    return rows.length
  } catch (err) {
    await logCron('player-stats', 'error', Date.now() - t0, { error: (err as Error).message })
    throw err
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const testSecret = process.env.TEST_SECRET

  if (process.env.NODE_ENV === 'production' && secret !== testSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const count = await scrapePlayerStats()
    return NextResponse.json({ ok: true, updated: count, season: CURRENT_SEASON })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret === process.env.TEST_SECRET) {
    const count = await scrapePlayerStats()
    return NextResponse.json({ ok: true, updated: count, season: CURRENT_SEASON })
  }

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  })

  const body = await request.text()
  const valid = await receiver
    .verify({
      signature: request.headers.get('Upstash-Signature') ?? '',
      body,
    })
    .catch(() => false)

  if (!valid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const count = await scrapePlayerStats()
    return NextResponse.json({ ok: true, updated: count, season: CURRENT_SEASON })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
