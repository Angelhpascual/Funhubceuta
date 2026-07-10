import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MvpRepository', () => ({
  getActiveMvpSession: vi.fn(),
  getMvpVoteTallies: vi.fn(),
}))

import { getActiveMvpSession, getMvpVoteTallies } from '@/infrastructure/supabase/MvpRepository'
import { GET } from '../route'

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/mvp/active', () => {
  it('returns null session when none active', async () => {
    vi.mocked(getActiveMvpSession).mockResolvedValue(null)
    const res = await GET()
    expect((await res.json()).session).toBeNull()
  })

  it('returns session with tallies when open', async () => {
    const session = { id: 's1', status: 'open', candidates: [] } as never
    const tallies = [{ candidate_id: 'c1', count: 3 }]
    vi.mocked(getActiveMvpSession).mockResolvedValue(session)
    vi.mocked(getMvpVoteTallies).mockResolvedValue(tallies)

    const body = await (await GET()).json()
    expect(body.session).toEqual(session)
    expect(body.tallies).toEqual(tallies)
    expect(getMvpVoteTallies).toHaveBeenCalledWith('s1')
  })

  it('returns session with tallies when closed', async () => {
    const session = { id: 's1', status: 'closed', candidates: [] } as never
    vi.mocked(getActiveMvpSession).mockResolvedValue(session)
    vi.mocked(getMvpVoteTallies).mockResolvedValue([])

    const body = await (await GET()).json()
    expect(getMvpVoteTallies).toHaveBeenCalledWith('s1')
    expect(body.tallies).toEqual([])
  })

  it('returns empty tallies when session is pending', async () => {
    const session = { id: 's1', status: 'pending', candidates: [] } as never
    vi.mocked(getActiveMvpSession).mockResolvedValue(session)

    const body = await (await GET()).json()
    expect(getMvpVoteTallies).not.toHaveBeenCalled()
    expect(body.tallies).toEqual([])
  })
})
