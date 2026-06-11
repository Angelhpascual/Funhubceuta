import { describe, it, expect } from 'vitest'
import { deduplicateMatches } from '../deduplicateMatches'

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-05-01',
    home_team: 'AD CEUTA FC',
    away_team: 'MÁLAGA CF',
    result: null,
    status: 'scheduled',
    ...overrides,
  }
}

describe('deduplicateMatches', () => {
  it('returns same rows when no duplicates', () => {
    const rows = [
      makeMatch({ date: '2026-05-01', away_team: 'MÁLAGA CF' }),
      makeMatch({ date: '2026-05-08', away_team: 'ALBACETE' }),
    ]
    expect(deduplicateMatches(rows)).toHaveLength(2)
  })

  it('removes exact duplicate keeping first', () => {
    const rows = [makeMatch({ result: null }), makeMatch({ result: null })]
    expect(deduplicateMatches(rows)).toHaveLength(1)
  })

  it('keeps the row with result when one has it and the other does not', () => {
    const rows = [makeMatch({ result: null }), makeMatch({ result: 'W' })]
    const deduped = deduplicateMatches(rows)
    expect(deduped).toHaveLength(1)
    expect(deduped[0].result).toBe('W')
  })

  it('keeps the row with result regardless of order', () => {
    const rows = [makeMatch({ result: 'W' }), makeMatch({ result: null })]
    const deduped = deduplicateMatches(rows)
    expect(deduped).toHaveLength(1)
    expect(deduped[0].result).toBe('W')
  })

  it('uses only the date portion (ignores time) for dedup key', () => {
    const rows = [
      makeMatch({ date: '2026-05-01T20:00:00', result: null }),
      makeMatch({ date: '2026-05-01T20:00:00', result: 'D' }),
    ]
    const deduped = deduplicateMatches(rows)
    expect(deduped).toHaveLength(1)
    expect(deduped[0].result).toBe('D')
  })

  it('treats different dates as different matches', () => {
    const rows = [makeMatch({ date: '2026-05-01' }), makeMatch({ date: '2026-05-08' })]
    expect(deduplicateMatches(rows)).toHaveLength(2)
  })

  it('treats different home teams as different matches', () => {
    const rows = [
      makeMatch({ home_team: 'AD CEUTA FC' }),
      makeMatch({ home_team: 'MÁLAGA CF', away_team: 'AD CEUTA FC' }),
    ]
    expect(deduplicateMatches(rows)).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(deduplicateMatches([])).toHaveLength(0)
  })
})
