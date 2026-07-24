import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@/lib/appEnv', () => ({ APP_ENV: 'development' }))

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

// Proxy chainable y thenable
function chain(terminal: Promise<unknown>): unknown {
  return new Proxy(() => {}, {
    get(_t, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
          terminal.then(resolve, reject)
      }
      return vi.fn((..._args: unknown[]) => chain(terminal))
    },
    apply() { return chain(terminal) },
  })
}

beforeEach(() => { vi.resetAllMocks() })

describe('getActivePredictionSession', () => {
  it('returns session when found', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'open' }
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: session })) as never)
    expect(await getActivePredictionSession()).toEqual(session)
  })

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
    expect(await getActivePredictionSession()).toBeNull()
  })
})

describe('getUserPrediction', () => {
  it('returns prediction for matching session + fingerprint', async () => {
    const vote = { id: 'v1', session_id: 's1', fingerprint: 'fp1', home_score: 2, away_score: 1, points: 50 }
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: vote })) as never)
    expect(await getUserPrediction('s1', 'fp1')).toEqual(vote)
  })
})

describe('upsertPrediction', () => {
  it('upserts with nickname when provided', async () => {
    const row = { id: 'v1', home_score: 2, away_score: 0, nickname: 'Tito' }
    const upsert = vi.fn().mockReturnValue(chain(Promise.resolve({ data: row, error: null })))
    mockFrom.mockReturnValue({ upsert } as never)

    const { data } = await upsertPrediction('s1', 'fp1', 2, 0, 'Tito')
    expect(data).toEqual(row)
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ nickname: 'Tito', home_score: 2, away_score: 0, environment: 'development' }),
      expect.any(Object)
    )
  })

  it('upserts without nickname when not provided', async () => {
    const upsert = vi.fn().mockReturnValue(chain(Promise.resolve({ data: {}, error: null })))
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
    const insert = vi.fn().mockReturnValue(chain(Promise.resolve({ data: session, error: null })))
    mockFrom.mockReturnValue({ insert } as never)

    const { data } = await createPredictionSession('Ceuta vs Betis', 'J20')
    expect(data).toEqual(session)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ match_label: 'Ceuta vs Betis', status: 'pending', environment: 'development' })
    )
  })
})

describe('openPredictionSession', () => {
  it('updates status to open', async () => {
    const update = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))
    mockFrom.mockReturnValue({ update } as never)
    const { error } = await openPredictionSession('s1')
    expect(error).toBeNull()
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
  })
})

describe('closePredictionSession', () => {
  it('calculates 50 points for exact result', async () => {
    const votes = [{ id: 'v1', home_score: 2, away_score: 1 }]
    const update = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return chain(Promise.resolve({ data: votes })) as never
      return { update } as never
    })
    await closePredictionSession('s1', 2, 1)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ points: 50 }))
  })

  it('calculates 15 points for correct winner', async () => {
    const votes = [{ id: 'v1', home_score: 1, away_score: 0 }]
    const update = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return chain(Promise.resolve({ data: votes })) as never
      return { update } as never
    })
    await closePredictionSession('s1', 3, 0)
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ points: 15 }))
  })

  it('calculates 0 points for wrong prediction', async () => {
    const votes = [{ id: 'v1', home_score: 1, away_score: 0 }]
    const update = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return chain(Promise.resolve({ data: votes })) as never
      return { update } as never
    })
    await closePredictionSession('s1', 0, 2)
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
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: rows })) as never)
    const ranking = await getPredictionSeasonRanking()
    expect(ranking[0].nickname).toBe('Tito')
    expect(ranking[0].points).toBe(65)
    expect(ranking[0].exactos).toBe(1)
    expect(ranking[1].nickname).toBe('Ana')
  })

  it('returns empty array when no data', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
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
      if (callCount === 1) return chain(Promise.resolve({ data: sessions })) as never
      return chain(Promise.resolve({ data: votes })) as never
    })
    const history = await getPredictionHistory()
    expect(history).toHaveLength(1)
    expect(history[0].votes).toEqual(votes)
  })
})
