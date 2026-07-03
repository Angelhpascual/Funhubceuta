import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/constants', () => ({
  ESPN_BASE: 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2',
  ESPN_CEUTA_ID: '5404',
  CURRENT_SEASON: '2025-2026',
}))
vi.mock('@/infrastructure/supabase/SquadSupabaseRepository', () => ({
  fetchPhotosByDorsal: vi.fn(),
}))
vi.mock('../parseLineupEvents', () => ({ parseLineupEvents: vi.fn(() => []) }))

import { fetchPhotosByDorsal } from '@/infrastructure/supabase/SquadSupabaseRepository'
import { GET } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(fetchPhotosByDorsal).mockResolvedValue({})
})

function makeEspnSummary(ceutaId = '5404', starterCount = 11) {
  const makePlayer = (i: number, starter: boolean) => ({
    starter,
    jersey: String(i + 1),
    position: { displayName: 'Center Midfielder' },
    athlete: {
      displayName: `Jugador ${i + 1}`,
      shortName: `J. ${i + 1}`,
      headshot: { href: 'https://espn.com/photo.jpg' },
      jerseyImages: [],
      links: [],
    },
  })

  return {
    rosters: [{
      team: { id: ceutaId },
      formation: '4-3-3',
      roster: [
        ...Array.from({ length: starterCount }, (_, i) => makePlayer(i, true)),
        makePlayer(starterCount, false),
      ],
    }],
    keyEvents: [],
    header: { competitions: [{ competitors: [{ homeAway: 'home', id: ceutaId }], keyEvents: [], details: [] }] },
  }
}

function makeRequest(eventId?: string) {
  const url = eventId
    ? `http://localhost/api/matches/lineup?eventId=${eventId}`
    : 'http://localhost/api/matches/lineup'
  return new Request(url)
}

describe('GET /api/matches/lineup', () => {
  it('returns 400 when eventId is missing', async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('eventId')
  })

  it('returns 502 when ESPN is unavailable', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(new Response('', { status: 503 }))
    const res = await GET(makeRequest('evt1'))
    expect(res.status).toBe(502)
  })

  it('returns available:false when Ceuta roster not found', async () => {
    const summary = makeEspnSummary('9999') // wrong team id
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(summary), { status: 200 })
    )
    const res = await GET(makeRequest('evt1'))
    const body = await res.json()
    expect(body.available).toBe(false)
  })

  it('returns available:false when fewer than 11 starters', async () => {
    const summary = makeEspnSummary('5404', 5)
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(summary), { status: 200 })
    )
    const res = await GET(makeRequest('evt1'))
    const body = await res.json()
    expect(body.available).toBe(false)
  })

  it('returns full lineup with 11 starters', async () => {
    const summary = makeEspnSummary('5404', 11)
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(summary), { status: 200 })
    )
    const res = await GET(makeRequest('evt1'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.available).toBe(true)
    expect(body.starters).toHaveLength(11)
    expect(body.bench).toHaveLength(1)
    expect(body.formation).toBe('4-3-3')
  })

  it('enriches player photos from squad DB', async () => {
    const summary = makeEspnSummary('5404', 11)
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(summary), { status: 200 })
    )
    vi.mocked(fetchPhotosByDorsal).mockResolvedValue({ '1': 'https://supabase.co/player1.jpg' })
    const res = await GET(makeRequest('evt1'))
    const body = await res.json()
    expect(body.starters[0].photoUrl).toBe('https://supabase.co/player1.jpg')
  })

  it('returns 500 on unexpected error', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'))
    const res = await GET(makeRequest('evt1'))
    expect(res.status).toBe(500)
  })
})
