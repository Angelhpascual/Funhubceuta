import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabaseAdmin } from '../adminClient'
import {
  getActiveMvpSession,
  getMvpVoteTallies,
  castMvpVote,
  hasVoted,
  createMvpSession,
  openMvpSession,
  closeMvpSession,
  getMvpHistory,
  getMvpSeasonRanking,
} from '../MvpRepository'

const mockFrom = vi.mocked(supabaseAdmin.from)

beforeEach(() => { vi.resetAllMocks() })

describe('getActiveMvpSession', () => {
  it('returns session when found', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'open' }
    const maybeSingle = vi.fn().mockResolvedValue({ data: session })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const order = vi.fn().mockReturnValue({ limit })
    const inFn = vi.fn().mockReturnValue({ order })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ in: inFn }) } as never)

    expect(await getActiveMvpSession()).toEqual(session)
  })

  it('returns null when not found', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const limit = vi.fn().mockReturnValue({ maybeSingle })
    const order = vi.fn().mockReturnValue({ limit })
    const inFn = vi.fn().mockReturnValue({ order })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ in: inFn }) } as never)

    expect(await getActiveMvpSession()).toBeNull()
  })
})

describe('getMvpVoteTallies', () => {
  it('counts votes per candidate', async () => {
    const rows = [{ candidate_id: 'c1' }, { candidate_id: 'c2' }, { candidate_id: 'c1' }]
    const eq = vi.fn().mockResolvedValue({ data: rows })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    const tallies = await getMvpVoteTallies('s1')
    const c1 = tallies.find(t => t.candidate_id === 'c1')
    const c2 = tallies.find(t => t.candidate_id === 'c2')
    expect(c1?.count).toBe(2)
    expect(c2?.count).toBe(1)
  })

  it('returns empty array when no data', async () => {
    const eq = vi.fn().mockResolvedValue({ data: null })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    expect(await getMvpVoteTallies('s1')).toEqual([])
  })
})

describe('castMvpVote', () => {
  it('inserts a vote row', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ insert } as never)

    const { error } = await castMvpVote('s1', 'c1', 'fp1')
    expect(error).toBeNull()
    expect(insert).toHaveBeenCalledWith({ session_id: 's1', candidate_id: 'c1', fingerprint: 'fp1' })
  })
})

describe('hasVoted', () => {
  it('returns true when vote exists', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: 'v1' } })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eq1 }) } as never)

    expect(await hasVoted('s1', 'fp1')).toBe(true)
  })

  it('returns false when no vote', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null })
    const eq2 = vi.fn().mockReturnValue({ maybeSingle })
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eq1 }) } as never)

    expect(await hasVoted('s1', 'fp1')).toBe(false)
  })
})

describe('createMvpSession', () => {
  it('inserts session and returns data', async () => {
    const session = { id: 's1', match_label: 'Ceuta vs X', status: 'pending' }
    const single = vi.fn().mockResolvedValue({ data: session, error: null })
    const select = vi.fn().mockReturnValue({ single })
    mockFrom.mockReturnValue({ insert: vi.fn().mockReturnValue({ select }) } as never)

    const { data } = await createMvpSession('Ceuta vs X', [
      { id: 'c1', name: 'Jugador 1', number: 9, position: 'DEL' },
      { id: 'c2', name: 'Jugador 2', number: 10, position: 'MED' },
    ])
    expect(data).toEqual(session)
  })
})

describe('openMvpSession', () => {
  it('updates status to open', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) } as never)

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
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // getMvpVoteTallies
        return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: tallies }) }) } as never
      }
      if (callCount === 2) {
        // select candidates
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { candidates } }) }),
          }),
        } as never
      }
      // update
      return { update } as never
    })

    await closeMvpSession('s1')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed', winner_name: 'Top Player', winner_votes: 2 })
    )
  })

  it('closes with null winner when no votes', async () => {
    let callCount = 0
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })

    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [] }) }) } as never
      if (callCount === 2) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { candidates: [] } }) }),
          }),
        } as never
      }
      return { update } as never
    })

    await closeMvpSession('s1')
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'closed', winner_id: null, winner_name: null })
    )
  })
})

describe('getMvpHistory', () => {
  it('returns closed sessions', async () => {
    const history = [{ id: 's1', match_label: 'Ceuta vs X', winner_name: 'Top Player', winner_votes: 5, closed_at: '2026-01-01' }]
    const limit = vi.fn().mockResolvedValue({ data: history })
    const order = vi.fn().mockReturnValue({ limit })
    const eq = vi.fn().mockReturnValue({ order })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    const result = await getMvpHistory()
    expect(result).toEqual(history)
  })

  it('returns empty array when no data', async () => {
    const limit = vi.fn().mockResolvedValue({ data: null })
    const order = vi.fn().mockReturnValue({ limit })
    const eq = vi.fn().mockReturnValue({ order })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

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
    const not = vi.fn().mockResolvedValue({ data: rows })
    const eq = vi.fn().mockReturnValue({ not })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    const ranking = await getMvpSeasonRanking()
    expect(ranking[0].name).toBe('Top Player')
    expect(ranking[0].wins).toBe(2)
    expect(ranking[0].votes).toBe(8)
    expect(ranking[0].photo_url).toBe('/p.jpg')
    expect(ranking[1].name).toBe('Other')
    expect(ranking[1].wins).toBe(1)
  })

  it('returns empty array when no data', async () => {
    const not = vi.fn().mockResolvedValue({ data: null })
    const eq = vi.fn().mockReturnValue({ not })
    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) } as never)

    expect(await getMvpSeasonRanking()).toEqual([])
  })
})
