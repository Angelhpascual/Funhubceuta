import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/espn/fetchMatchResult', () => ({ fetchEspnMatchResult: vi.fn() }))
vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({ setConfig: vi.fn() }))

import { fetchEspnMatchResult } from '@/infrastructure/espn/fetchMatchResult'
import { setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { closeFinishedMatchesFromEspn, persistCeutaForm } from '../closeFinishedMatches'

function makeRepo(overrides: Partial<Record<'fetchUnfinishedPast' | 'markMatchFinished', ReturnType<typeof vi.fn>>> = {}) {
  return {
    fetchUnfinishedPast: overrides.fetchUnfinishedPast ?? vi.fn().mockResolvedValue([]),
    markMatchFinished: overrides.markMatchFinished ?? vi.fn().mockResolvedValue(undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

beforeEach(() => { vi.resetAllMocks() })

describe('closeFinishedMatchesFromEspn', () => {
  it('closes a pending match once ESPN reports it post, computing W/L/D from Ceuta\'s side', async () => {
    const markMatchFinished = vi.fn().mockResolvedValue(undefined)
    const repo = makeRepo({
      fetchUnfinishedPast: vi.fn().mockResolvedValue([
        { espnEventId: '401883179', homeTeam: 'Ceuta', awayTeam: 'Real Oviedo' },
      ]),
      markMatchFinished,
    })
    vi.mocked(fetchEspnMatchResult).mockResolvedValue({
      state: 'post', homeTeam: 'Ceuta', awayTeam: 'Real Oviedo', homeScore: 1, awayScore: 2,
    })

    const closed = await closeFinishedMatchesFromEspn(repo)

    expect(markMatchFinished).toHaveBeenCalledWith('401883179', 1, 2, 'L')
    expect(closed).toEqual(['401883179'])
  })

  it('skips a match still in progress or with no ESPN data', async () => {
    const markMatchFinished = vi.fn()
    const repo = makeRepo({
      fetchUnfinishedPast: vi.fn().mockResolvedValue([
        { espnEventId: 'x', homeTeam: 'Ceuta', awayTeam: 'Rival' },
      ]),
      markMatchFinished,
    })
    vi.mocked(fetchEspnMatchResult).mockResolvedValue(null)

    const closed = await closeFinishedMatchesFromEspn(repo)

    expect(markMatchFinished).not.toHaveBeenCalled()
    expect(closed).toEqual([])
  })
})

describe('persistCeutaForm', () => {
  it('saves a non-empty form', async () => {
    await persistCeutaForm(['W', 'L', 'D'])
    expect(setConfig).toHaveBeenCalledWith('ceuta_form', 'W,L,D')
  })

  it('does nothing for an empty form', async () => {
    await persistCeutaForm([])
    expect(setConfig).not.toHaveBeenCalled()
  })
})
