import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@/lib/deduplicateMatches', () => ({
  deduplicateMatches: (rows: unknown[]) => rows,
}))

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import { MatchesSupabaseRepository } from '../MatchesSupabaseRepository'

const repo = new MatchesSupabaseRepository()

beforeEach(() => { vi.resetAllMocks() })

function makeResult(overrides = {}) {
  return {
    homeTeam: 'AD Ceuta FC', awayTeam: 'Real Madrid',
    homeScore: 1, awayScore: 0, date: '2026-05-01',
    weekday: 'Jueves', result: 'W' as const, isHome: true, espnEventId: null,
    ...overrides,
  }
}

describe('upsertResults', () => {
  it('does nothing for empty array', async () => {
    await repo.upsertResults([])
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('upserts results with correct shape', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await repo.upsertResults([makeResult()])

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          home_team: 'AD Ceuta FC',
          away_team: 'Real Madrid',
          status: 'finished',
          result: 'W',
          home_score: 1,
          away_score: 0,
        }),
      ]),
      { onConflict: 'external_id', ignoreDuplicates: false }
    )
  })

  it('builds external_id with the same date-teams scheme as upsertMatches (regression: a mismatched "result-" prefix left a scheduled and a finished row stuck side by side for the same match)', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await repo.upsertResults([makeResult({ date: '2026-05-01', homeTeam: 'AD Ceuta FC', awayTeam: 'Real Madrid' })])

    const [rows] = upsertMock.mock.calls[0]
    expect(rows[0].external_id).toBe('2026-05-01-ad-ceuta-fc-real-madrid')
  })

  it('throws when supabase returns error', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)
    await expect(repo.upsertResults([makeResult()])).rejects.toThrow('constraint violation')
  })
})

function makeScrapedMatch(overrides = {}) {
  return {
    homeTeam: 'Ceuta', awayTeam: 'Rival', date: '2026-10-10', time: '18:00',
    weekday: 'Sábado', isHome: true, ticketsUrl: null, espnEventId: 'espn-1',
    ...overrides,
  }
}

// upsertMatches makes up to 3 separate `.from('matches')` calls (SELECT
// existing scheduled rows, upsert the scrape, maybe DELETE stale ones) — the
// mock routes each by which method gets called on it.
function mockMatchesFrom(opts: { existingRows?: Array<{ id: string; external_id: string }> }) {
  const { existingRows = [] } = opts
  const eqForSelect = vi.fn().mockResolvedValue({ data: existingRows })
  const selectMock = vi.fn().mockReturnValue({ eq: eqForSelect })
  const upsertMock = vi.fn().mockResolvedValue({ error: null })
  const inMock = vi.fn().mockResolvedValue({ error: null })
  const deleteMock = vi.fn().mockReturnValue({ in: inMock })

  vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
    select: selectMock,
    upsert: upsertMock,
    delete: deleteMock,
  }) as never)

  return { selectMock, upsertMock, deleteMock, inMock }
}

describe('upsertMatches', () => {
  it('does nothing for an empty array', async () => {
    await repo.upsertMatches([])
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('upserts by external_id instead of delete-then-insert', async () => {
    const { upsertMock } = mockMatchesFrom({ existingRows: [] })

    await repo.upsertMatches([makeScrapedMatch()])

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ external_id: '2026-10-10-ceuta-rival', status: 'scheduled' })]),
      { onConflict: 'external_id' }
    )
  })

  it('prunes scheduled rows missing from a complete-looking scrape', async () => {
    const { inMock } = mockMatchesFrom({
      existingRows: [
        { id: 'row-1', external_id: '2026-10-10-ceuta-rival' }, // still present
        { id: 'row-2', external_id: '2026-10-18-ceuta-oviedo' }, // gone → stale
      ],
    })

    await repo.upsertMatches([makeScrapedMatch()])

    expect(inMock).toHaveBeenCalledWith('id', ['row-2'])
  })

  it('does NOT prune anything when the scrape looks partial (regression: a delete-then-reinsert used to wipe every upcoming fixture on a bad scrape)', async () => {
    // 10 fixtures already stored, scrape only returned 1 — nowhere near half.
    const existingRows = Array.from({ length: 10 }, (_, i) => ({ id: `row-${i}`, external_id: `ext-${i}` }))
    const { deleteMock } = mockMatchesFrom({ existingRows })

    await repo.upsertMatches([makeScrapedMatch()])

    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('still upserts the fixtures it did get even when the scrape looks partial', async () => {
    const existingRows = Array.from({ length: 10 }, (_, i) => ({ id: `row-${i}`, external_id: `ext-${i}` }))
    const { upsertMock } = mockMatchesFrom({ existingRows })

    await repo.upsertMatches([makeScrapedMatch()])

    expect(upsertMock).toHaveBeenCalled()
  })

  it('throws when the upsert reports an error', async () => {
    const { upsertMock } = mockMatchesFrom({ existingRows: [] })
    upsertMock.mockResolvedValue({ error: { message: 'constraint violation' } })

    await expect(repo.upsertMatches([makeScrapedMatch()])).rejects.toThrow('constraint violation')
  })
})

describe('fetchBySeason', () => {
  it('returns deduplicated matches for a season', async () => {
    const rows = [{ date: '2026-05-01', home_team: 'Ceuta', away_team: 'Madrid', result: null, status: 'scheduled' }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: rows }),
          }),
        }),
      }),
    } as never)

    const result = await repo.fetchBySeason('2025-2026')
    expect(result).toHaveLength(1)
  })
})

describe('fetchScheduled', () => {
  it('normalizes a timestamptz `date` (prod drift) down to YYYY-MM-DD', async () => {
    // Regression: prod's `date` column returns "2026-09-05 00:00:00+00" —
    // without slicing, this broke the .ics feed (madridDateTimeToUtc got fed
    // an unparseable string and every event was silently dropped).
    const rows = [{
      id: 'uuid-1', home_team: 'Ceuta', away_team: 'RC Celta Fortuna',
      date: '2026-09-05 00:00:00+00', time: '18:30', weekday: 'Sábado',
      is_home: true, venue: null, espn_event_id: 'espn-1',
    }]
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: rows }),
          }),
        }),
      }),
    } as never)

    const result = await repo.fetchScheduled()
    expect(result[0].date).toBe('2026-09-05')
  })

  it('leaves an already-plain date untouched', async () => {
    const rows = [{
      id: 'uuid-2', home_team: 'Ceuta', away_team: 'Burgos',
      date: '2026-09-11', time: '20:30', weekday: 'Viernes',
      is_home: false, venue: null, espn_event_id: null,
    }]
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: rows }),
          }),
        }),
      }),
    } as never)

    const result = await repo.fetchScheduled()
    expect(result[0].date).toBe('2026-09-11')
  })
})

describe('fetchByEspnId', () => {
  it('returns match date and time when found', async () => {
    const chain = { maybeSingle: vi.fn().mockResolvedValue({ data: { date: '2026-05-10', time: '20:00' } }) }
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(chain) }),
    } as never)

    const result = await repo.fetchByEspnId('espn-123')
    expect(result).toEqual({ date: '2026-05-10', time: '20:00' })
  })

  it('returns null when not found', async () => {
    const chain = { maybeSingle: vi.fn().mockResolvedValue({ data: null }) }
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue(chain) }),
    } as never)

    const result = await repo.fetchByEspnId('nonexistent')
    expect(result).toBeNull()
  })
})

describe('fetchRecentForm', () => {
  it('returns results in chronological order (reversed from DB)', async () => {
    const data = [
      { result: 'W', date: '2026-05-10' },
      { result: 'D', date: '2026-05-05' },
      { result: 'L', date: '2026-04-28' },
    ]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data }),
            }),
          }),
        }),
      }),
    } as never)

    const form = await repo.fetchRecentForm()
    expect(form).toEqual(['L', 'D', 'W'])
  })

  it('returns empty array when no finished matches', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }),
    } as never)

    const form = await repo.fetchRecentForm()
    expect(form).toEqual([])
  })
})

describe('fetchUnfinishedPast', () => {
  it('maps rows to the shape closeFinishedMatchesFromEspn expects', async () => {
    const data = [
      { home_team: 'Castellón', away_team: 'Ceuta', date: '2026-10-04', espn_event_id: '401883162' },
    ]
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data }),
          }),
        }),
      }),
    } as never)

    const result = await repo.fetchUnfinishedPast()
    expect(result).toEqual([{ espnEventId: '401883162', homeTeam: 'Castellón', awayTeam: 'Ceuta' }])
  })

  it('returns empty array when nothing is pending', async () => {
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            not: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    } as never)

    const result = await repo.fetchUnfinishedPast()
    expect(result).toEqual([])
  })
})
