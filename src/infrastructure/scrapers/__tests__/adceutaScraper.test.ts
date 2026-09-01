import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrapeNextMatches } from '../adceutaScraper'

const CEUTA_ID = '5404'

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt1',
    date: '2026-09-20T18:00Z',
    competitions: [{
      status: { type: { state: 'pre' } },
      competitors: [
        { homeAway: 'home', team: { id: CEUTA_ID, displayName: 'Ceuta' } },
        { homeAway: 'away', team: { id: '95', displayName: 'Real Valladolid' } },
      ],
    }],
    ...overrides,
  }
}

function pastEvent() {
  return makeEvent({
    id: 'past1',
    date: '2026-08-30T17:00Z',
    competitions: [{
      status: { type: { state: 'post' } },
      competitors: [
        { homeAway: 'home', team: { id: '84', displayName: 'Mallorca' } },
        { homeAway: 'away', team: { id: CEUTA_ID, displayName: 'Ceuta' } },
      ],
    }],
  })
}

describe('scrapeNextMatches', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('falls back to the scoreboard scan when the team endpoint only has past fixtures', async () => {
    // ESPN's team schedule endpoint can lag and only expose already-played
    // matches for a while after each matchday — regression test for a bug
    // where this caused upcoming fixtures (and schedule changes) to be
    // silently skipped instead of falling through to the scoreboard.
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent()] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent(), makeEvent()] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const matches = await scrapeNextMatches()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(matches).toHaveLength(1)
    expect(matches[0].awayTeam).toBe('Real Valladolid')
  })

  it('trusts the team endpoint directly when it already has an upcoming match', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent(), makeEvent()] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const matches = await scrapeNextMatches()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(matches).toHaveLength(1)
  })
})
