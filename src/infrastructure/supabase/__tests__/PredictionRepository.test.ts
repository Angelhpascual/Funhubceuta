import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabaseAdmin } from '../adminClient'
import {
  getActivePredictionSession,
  getUserPrediction,
  upsertPrediction,
  createPredictionSession,
  openPredictionSession,
  closePredictionSession,
  getPredictionHistory,
  getPredictionSeasonRanking,
} from '../PredictionRepository'

const mockFrom = vi.mocked(supabaseAdmin.from)

function chainSelect(data: unknown, error: null = null) {
  const terminal = { data, error }
  const maybeSingle = vi.fn().mockResolvedValue(terminal)
  const single = vi.fn().mockResolvedValue(terminal)
  const limit = vi.fn().mockReturnValue({ maybeSingle })
  const order = vi.fn().mockReturnValue({ limit, maybeSingle, ...terminal })
  const eq = vi.fn()
  const inFn = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ in: inFn, eq, order, maybeSingle, single, ...terminal })
  eq.mockReturnValue({ maybeSingle, select, eq, ...terminal })
  return { select, eq, in: inFn, order, limit, maybeSingle, single }
}

beforeEach(() => { vi.resetAllMocks() })

describe('getActivePredictionSession', () => {
  it('returns session when found', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'open' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: session })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const order = vi.fn().mockReturnValue({ limit })
    const inFn = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ in: inFn })
    mockFrom.mockReturnValue({ select } as never)

    const result = await getActivePredictionSession()
    expect(result).toEqual(session)
    expect(inFn).toHaveBeenCalledWith('status', ['pending', 'open', 'closed'])
  })

  it('returns null when not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const order = vi.fn().mockReturnValue({ limit })
    const inFn = vi.fn().mockReturnValue({ order })
    const select = vi.fn().mockReturnValue({ in: inFn })
    mockFrom.mockReturnValue({ select } as never)

    expect(await getActivePredictionSession()).toBeNull()
  })
})

describe('getUserPrediction', () => {
  it('returns prediction for matching session + fingerprint', async () => {
    const vote = { id: 'v1', session_id: 's1', fingerprint: 'fp1', home_score: 2, away_score: 1, points: 50 }
    const maybeSingle = vi.fn().mockResolvedValue({ data: vote })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    const select = vi.fn().mockReturnValue({ eq: eq1 })
    mockFrom.mockReturnValue({ select } as never)

    const result = await getUserPrediction('s1', 'fp1')
    expect(result).toEqual(vote)
  })
})

describe('upsertPrediction', () => {
  it('upserts with nickname when provided', async () => {
    const row = { id: 'v1', home_score: 2, away_score: 0, nickname: 'Tito' }
    const single = vi.fn().mockResolvedValue({ data: row, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ upsert } as never)

    const { data } = await upsertPrediction('s1', 'fp1', 2, 0, 'Tito')
    expect(data).toEqual(row)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: 'Tito', home_score: 2, away_score: 0 }),
      expect.any(Object)
    )
  })

  it('upserts without nickname when not provided', async () => {
    const single = vi.fn().mockResolvedValue({ data: {}, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const upsert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ upsert } as never)

    await upsertPrediction('s1', 'fp1', 1, 1)
    expect(upsert).toHaveBeenCalledWith(
      expect.not.objectContaining({ nickname: expect.anything() }),
      expect.any(Object)
    )
  })
})

describe('createPredictionSession', () => {
  it('inserts session and returns data', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs Betis', status: 'pending' }
    const single = vi.fn().mockResolvedValue({ data: session, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mockFrom.mockReturnValue({ insert } as never)

    const { data } = await createPredictionSession('Ceuta vs Betis', 'J20')
    expect(data).toEqual(session)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ match_label: 'Ceuta vs Betis', status: 'pending' })
    )
  })
})

describe('openPredictionSession', () => {
  it('updates status to open', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    mockFrom.mockReturnValue({ update } as never)

    const { error } = await openPredictionSession('s1')
    expect(error).toBeNull()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
  })
})

describe('closePredictionSession', () => {
  it('calculates 50 points for exact result', async () => {
    const votes = [{ id: 'v1', home_score: 2, away_score: 1 }]
    const selectRes = vi.fn().mockResolvedValue({ data: votes })
    const eqSelect = vi.fn().mockReturnValue({ selectRes })

    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // first from: select votes
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: votes, error: null }),
          }),
        } as never
      }
      // update calls
      return { update } as never
    })

    await closePredictionSession('s1', 2, 1)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ points: 50 }))
  })

  it('calculates 15 points for correct winner', async () => {
    const votes = [{ id: 'v1', home_score: 1, away_score: 0 }]
    let callCount = 0
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: votes, error: null }),
          }),
        } as never
      }
      return { update } as never
    })

    await closePredictionSession('s1', 3, 0) // same winner, different score
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ points: 15 }))
  })

  it('calculates 0 points for wrong prediction', async () => {
    const votes = [{ id: 'v1', home_score: 1, away_score: 0 }]
    let callCount = 0
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ data: votes, error: null }),
          }),
        } as never
      }
      return { update } as never
    })

    await closePredictionSession('s1', 0, 2) // away wins, predicted home win
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ points: 0 }))
  })
})

describe('getPredictionSeasonRanking', () => {
  it('aggregates points by fingerprint and sorts', async () => {
    const rows = [
      { fingerprint: 'fp1', points: 50, home_score: 2, away_score: 1, nickname: 'Tito' },
      { fingerprint: 'fp2', points: 15, home_score: 1, away_score: 0, nickname: 'Ana' },
      { fingerprint: 'fp1', points: 15, home_score: 1, away_score: 0, nickname: 'Tito' },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: rows }),
      }),
    } as never)

    const ranking = await getPredictionSeasonRanking()
    expect(ranking[0].nickname).toBe('Tito')
    expect(ranking[0].points).toBe(65)
    expect(ranking[0].exactos).toBe(1)
    expect(ranking[1].nickname).toBe('Ana')
    expect(ranking[1].points).toBe(15)
  })

  it('returns empty array when no data', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockResolvedValue({ data: null }),
      }),
    } as never)

    expect(await getPredictionSeasonRanking()).toEqual([])
  })
})

describe('getPredictionHistory', () => {
  it('returns sessions with votes', async () => {
    const sessions = [{ id: 's1', match_label: 'Ceuta vs X', jornada: 'J20', result: { home: 2, away: 1 }, closed_at: '2026-01-01' }]
    const votes = [{ nickname: 'Tito', fingerprint: 'fp1', home_score: 2, away_score: 1, points: 50 }]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: sessions }),
              }),
            }),
          }),
        } as never
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: votes }),
          }),
        }),
      } as never
    })

    const history = await getPredictionHistory()
    expect(history).toHaveLength(1)
    expect(history[0].votes).toEqual(votes)
  })
})
