import { NextResponse } from 'next/server'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'

const LALIGA_URL = 'https://www.laliga.com/en-GB/clubs/ad-ceuta-fc/stats'
const CDN_BASE = 'https://assets.laliga.com/squad/2025/t14705'

const STAT_LABELS: Record<string, { label: string; icon: string }> = {
  total_goals_ranking:         { label: 'Goleadores',     icon: '⚽' },
  total_assists_ranking:       { label: 'Asistencias',    icon: '🎯' },
  total_ontarget_attempt_ranking: { label: 'Disparos a puerta', icon: '🥊' },
  total_pass_ranking:          { label: 'Pases',          icon: '🔵' },
  total_interception_ranking:  { label: 'Interceptaciones', icon: '🛡️' },
  total_yellow_card_ranking:   { label: 'Tarjetas amarillas', icon: '🟨' },
  total_red_card_ranking:      { label: 'Tarjetas rojas', icon: '🟥' },
}

interface LaLigaPlayer {
  opta_player_id: string
  stats: { name: string; stat: number }[]
  extra_info: {
    name: string
    slug: string
    shirtNumber: number
  }
}

async function scrapeLeaders() {
  const res = await fetch(LALIGA_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FunHubCeuta/1.0)' },
    next: { revalidate: 0 },
  })
  if (!res.ok) throw new Error(`LaLiga responded ${res.status}`)

  const html = await res.text()
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
  if (!match) throw new Error('__NEXT_DATA__ not found in LaLiga page')

  const data = JSON.parse(match[1])
  const rawStats: Record<string, LaLigaPlayer[]> = data?.props?.pageProps?.leadersStats ?? {}

  const result: Record<string, { label: string; icon: string; leaders: { name: string; value: number; photo: string }[] }> = {}

  for (const [key, players] of Object.entries(rawStats)) {
    const statKey = key.replace('stat.', '')
    const meta = STAT_LABELS[statKey]
    if (!meta) continue

    const statName = statKey.replace('_ranking', '').replace('total_', '')

    result[statKey] = {
      label: meta.label,
      icon: meta.icon,
      leaders: players.slice(0, 5).map((p) => {
        const value = p.stats.find(s => s.name === `total_${statName}`)?.stat
          ?? p.stats.find(s => !s.name.includes('ranking'))?.stat
          ?? 0
        const pid = p.opta_player_id
        return {
          name: p.extra_info.name,
          value,
          photo: `${CDN_BASE}/${pid}/256x256/${pid}_t14705_2025_1_003_000.png`,
        }
      }),
    }
  }

  return result
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const leaders = await scrapeLeaders()
    await setConfig('ceuta_leaders', JSON.stringify(leaders))
    return NextResponse.json({ ok: true, categories: Object.keys(leaders).length })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cron/stats]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export { GET as POST }
