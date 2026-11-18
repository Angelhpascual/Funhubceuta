import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))
vi.mock('@/lib/appEnv', () => ({ getAppEnv: () => 'development' }))

import { supabaseAdmin } from '../adminClient'
import {
  getActiveMvpSession,
  getMvpVoteTallies,
  castMvpVote,
  createMvpSession,
  openMvpSession,
  closeMvpSession,
  getMvpHistory,
  getMvpSeasonRanking,
} from '../MvpRepository'

const mockFrom = vi.mocked(supabaseAdmin.from)

// Proxy chainable y thenable:
// - cualquier método devuelve otro chain
// - await sobre el chain resuelve terminal
function chain(terminal: Promise<unknown>): unknown {
  return new Proxy(() => {}, {
    get(_t, prop) {
      if (prop === 'then') {
        // hace el chain thenable → await chain(...) resuelve terminal
        return (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
          terminal.then(resolve, reject)
      }
      return vi.fn((..._args: unknown[]) => chain(terminal))
    },
    apply() { return chain(terminal) },
  })
}

beforeEach(() => { vi.resetAllMocks() })

describe('getActiveMvpSession', () => {
  it('returns session when found', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'open' }
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: session })) as never)
    expect(await getActiveMvpSession()).toEqual(session)
  })

  it('returns null when not found', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
    expect(await getActiveMvpSession()).toBeNull()
  })
})

describe('getMvpVoteTallies', () => {
  it('counts votes per candidate', async () => {
    const rows = [{ candidate_id: 'c1' }, { candidate_id: 'c2' }, { candidate_id: 'c1' }]
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: rows })) as never)
    const tallies = await getMvpVoteTallies('s1')
    expect(tallies.find(t => t.candidate_id === 'c1')?.count).toBe(2)
    expect(tallies.find(t => t.candidate_id === 'c2')?.count).toBe(1)
  })

  it('returns empty array when no data', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
    expect(await getMvpVoteTallies('s1')).toEqual([])
  })
})

describe('castMvpVote', () => {
  it('upserts a vote row keyed by session_id+fingerprint (allows changing vote)', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert } as never)
    const { error } = await castMvpVote('s1', 'c1', 'fp1')
    expect(error).toBeNull()
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ session_id: 's1', candidate_id: 'c1', fingerprint: 'fp1', environment: 'development' }),
      expect.objectContaining({ onConflict: 'session_id,fingerprint' })
    )
  })

  it('propagates DB errors', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { code: '99999', message: 'fail' } })
    mockFrom.mockReturnValue({ upsert } as never)
    const { error } = await castMvpVote('s1', 'c1', 'fp1')
    expect(error).toEqual({ code: '99999', message: 'fail' })
  })
})

describe('createMvpSession', () => {
  it('inserts session and returns data', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'pending' }
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: session, error: null })) as never)
    const { data } = await createMvpSession('Ceuta vs X', [
      { id: 'c1', name: 'Jugador 1', number: 9, position: 'DEL' },
    ])
    expect(data).toEqual(session)
  })
})

describe('openMvpSession', () => {
  it('updates status to open', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ error: null })) as never)
    const { error } = await openMvpSession('s1')
    expect(error).toBeNull()
  })
})

describe('closeMvpSession', () => {
  it('sets winner from tallies and closes session', async () => {
    const candidates = [
      { id: 'c1', name: 'Top Player', number: 9, position: 'DEL' },
      { id: 'c2', name: 'Other', number: 10, position: 'MED' },
    ]
    const tallies = [{ candidate_id: 'c1' }, { candidate_id: 'c1' }, { candidate_id: 'c2' }]
    let callCount = 0
    const updateFn = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return chain(Promise.resolve({ data: tallies })) as never
      if (callCount === 2) return chain(Promise.resolve({ data: { candidates } })) as never
      return { update: updateFn } as never
    })

    await closeMvpSession('s1')
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed', winner_name: 'Top Player', winner_votes: 2 })
    )
  })

  it('closes with null winner when no votes', async () => {
    let callCount = 0
    const updateFn = vi.fn().mockReturnValue(chain(Promise.resolve({ error: null })))

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return chain(Promise.resolve({ data: [] })) as never
      if (callCount === 2) return chain(Promise.resolve({ data: { candidates: [] } })) as never
      return { update: updateFn } as never
    })

    await closeMvpSession('s1')
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed', winner_id: null, winner_name: null })
    )
  })
})

describe('getMvpHistory', () => {
  it('returns closed sessions', async () => {
    const history = [{ id: 's1', match_label: 'Ceuta vs X', winner_name: 'Top Player', winner_votes: 5, closed_at: '2026-01-01' }]
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: history })) as never)
    expect(await getMvpHistory()).toEqual(history)
  })

  it('returns empty array when no data', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
    expect(await getMvpHistory()).toEqual([])
  })
})

describe('getMvpSeasonRanking', () => {
  it('aggregates wins and votes by winner_name', async () => {
    const candidates = [{ id: 'c1', name: 'Top Player', number: 9, position: 'DEL', photo_url: '/p.jpg' }]
    const rows = [
      { winner_name: 'Top Player', winner_id: 'c1', winner_votes: 5, candidates },
      { winner_name: 'Top Player', winner_id: 'c1', winner_votes: 3, candidates },
      { winner_name: 'Other', winner_id: 'c2', winner_votes: 4, candidates: [{ id: 'c2', name: 'Other', number: 10, position: 'MED' }] },
    ]
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: rows })) as never)
    const ranking = await getMvpSeasonRanking()
    expect(ranking[0].name).toBe('Top Player')
    expect(ranking[0].wins).toBe(2)
    expect(ranking[0].votes).toBe(8)
    expect(ranking[1].name).toBe('Other')
  })

  it('returns empty array when no data', async () => {
    mockFrom.mockReturnValue(chain(Promise.resolve({ data: null })) as never)
    expect(await getMvpSeasonRanking()).toEqual([])
  })
})
