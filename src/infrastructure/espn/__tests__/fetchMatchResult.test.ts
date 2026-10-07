import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/fetchWithTimeout', () => ({ fetchWithTimeout: vi.fn() }))

import { fetchWithTimeout } from '@/lib/fetchWithTimeout'
import { fetchEspnMatchResult } from '../fetchMatchResult'

beforeEach(() => { vi.resetAllMocks() })

function makeSummary(state: string, homeScore = '1', awayScore = '1') {
  return {
    header: {
      competitions: [{
        id: '401883162',
        date: '2026-10-04T16:30Z',
        status: { type: { state, description: state } },
        competitors: [
          { homeAway: 'home', team: { id: '1', displayName: 'Castellón' }, score: homeScore },
          { homeAway: 'away', team: { id: '2', displayName: 'Ceuta' }, score: awayScore },
        ],
      }],
    },
  }
}

describe('fetchEspnMatchResult', () => {
  it('parses a finished match from the summary endpoint, independent of today\'s scoreboard', async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true, json: async () => makeSummary('post', '1', '1'),
    } as Response)

    const result = await fetchEspnMatchResult('401883162')
    expect(result).toEqual({ state: 'post', homeTeam: 'Castellón', awayTeam: 'Ceuta', homeScore: 1, awayScore: 1 })
  })

  it('returns null when ESPN responds with a non-ok status', async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({ ok: false } as Response)
    expect(await fetchEspnMatchResult('bad-id')).toBeNull()
  })

  it('returns null when the response has no competition data', async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({ ok: true, json: async () => ({ header: {} }) } as Response)
    expect(await fetchEspnMatchResult('401883162')).toBeNull()
  })

  it('reports state "pre" or "in" as-is for a match not yet finished', async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValue({
      ok: true, json: async () => makeSummary('in', '0', '0'),
    } as Response)

    const result = await fetchEspnMatchResult('401883162')
    expect(result?.state).toBe('in')
  })
})
