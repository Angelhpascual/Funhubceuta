import { describe, it, expect } from 'vitest'
import { deduplicateMatches } from '../deduplicateMatches'

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-05-01',
    home_team: 'AD Ceuta FC',
    away_team: 'Real Madrid',
    result: null,
    status: 'scheduled',
    ...overrides,
  }
}

describe('deduplicateMatches', () => {
  it('returns empty array for empty input', () => {
    expect(deduplicateMatches([])).toEqual([])
  })

  it('keeps single match unchanged', () => {
    const m = makeMatch()
    expect(deduplicateMatches([m])).toEqual([m])
  })

  it('deduplicates same date+teams', () => {
    const a = makeMatch({ result: null })
    const b = makeMatch({ result: null })
    expect(deduplicateMatches([a, b])).toHaveLength(1)
  })

  it('prefers the row that has a result', () => {
    const noResult = makeMatch({ result: null, status: 'scheduled' })
    const withResult = makeMatch({ result: 'W', status: 'finished' })
    const out = deduplicateMatches([noResult, withResult])
    expect(out).toHaveLength(1)
    expect(out[0].result).toBe('W')
  })

  it('keeps matches with different dates separate', () => {
    const a = makeMatch({ date: '2026-05-01' })
    const b = makeMatch({ date: '2026-05-08' })
    expect(deduplicateMatches([a, b])).toHaveLength(2)
  })

  it('keeps matches with different teams separate', () => {
    const a = makeMatch({ away_team: 'Real Madrid' })
    const b = makeMatch({ away_team: 'FC Barcelona' })
    expect(deduplicateMatches([a, b])).toHaveLength(2)
  })

  it('deduplicates same fixture named differently by different scrapers', () => {
    const scheduled = makeMatch({
      date: '2026-08-15',
      home_team: 'FC Andorra',
      away_team: 'AD Ceuta FC',
      result: null,
      status: 'scheduled',
    })
    const finished = makeMatch({
      date: '2026-08-15',
      home_team: 'FC Andorra',
      away_team: 'Ceuta',
      result: 'L',
      status: 'finished',
    })
    const out = deduplicateMatches([scheduled, finished])
    expect(out).toHaveLength(1)
    expect(out[0].result).toBe('L')
  })

  it('deduplicates when home/away naming also differs (UD Las Palmas vs Las Palmas)', () => {
    const scheduled = makeMatch({
      date: '2026-08-22',
      home_team: 'AD Ceuta FC',
      away_team: 'UD Las Palmas',
      result: null,
      status: 'scheduled',
    })
    const finished = makeMatch({
      date: '2026-08-22',
      home_team: 'Ceuta',
      away_team: 'Las Palmas',
      result: 'L',
      status: 'finished',
    })
    const out = deduplicateMatches([scheduled, finished])
    expect(out).toHaveLength(1)
    expect(out[0].result).toBe('L')
  })
})
