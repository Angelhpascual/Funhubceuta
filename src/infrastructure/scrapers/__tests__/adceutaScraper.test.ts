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
    //
    // The fallback scans the current month plus the next two (one request
    // each, in parallel) — regression test for a bug where ESPN's soccer
    // scoreboard stopped accepting a date RANGE (dates=START-END, HTTP 400)
    // while a single month (dates=YYYYMM) still works.
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent()] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent(), makeEvent()] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const matches = await scrapeNextMatches()

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(fetchMock.mock.calls.every(([url]) => !String(url).includes('-'))).toBe(true)
    expect(matches).toHaveLength(1)
    expect(matches[0].awayTeam).toBe('Real Valladolid')
  })

  it('throws instead of silently returning no matches when the scoreboard fallback responds with an error (regression: a 400 from a bad date-range query was previously indistinguishable from a normal "no matches" week)', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent()] }), { status: 200 }))
      .mockResolvedValueOnce(new Response('', { status: 400 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(scrapeNextMatches()).rejects.toThrow('400')
  })

  it('trusts the team endpoint directly when it already has an upcoming match', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent(), makeEvent()] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const matches = await scrapeNextMatches()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(matches).toHaveLength(1)
  })

  it('skips a malformed event (missing home/away) instead of throwing and failing every other fixture in the batch (regression: ESPN has sent corrupt events for this team/competition twice this session)', async () => {
    const malformed = makeEvent({
      id: 'corrupt1',
      date: '2026-09-21T18:00Z',
      competitions: [{
        status: { type: { state: 'pre' } },
        competitors: [{ homeAway: 'home', team: { id: CEUTA_ID, displayName: 'Ceuta' } }], // no 'away'
      }],
    })
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ events: [pastEvent(), malformed, makeEvent()] }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const matches = await scrapeNextMatches()

    expect(matches).toHaveLength(1)
    expect(matches[0].awayTeam).toBe('Real Valladolid')
  })
})
