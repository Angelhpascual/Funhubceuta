import { describe, it, expect } from 'vitest'
import { formatMatchDate, shortTeamName, resultLabel } from '../matchUtils'

describe('formatMatchDate', () => {
  it('returns zero-padded day and uppercase short month', () => {
    const { day, mon } = formatMatchDate('2026-05-03')
    expect(day).toBe('03')
    expect(mon).toBe('MAY')
  })

  it('uses UTC date to avoid timezone shifts', () => {
    // 2026-01-01T00:00:00Z should be day 01, not Dec 31
    const { day, mon } = formatMatchDate('2026-01-01')
    expect(day).toBe('01')
    expect(mon).toBe('ENE')
  })

  it('pads single-digit days', () => {
    const { day } = formatMatchDate('2026-09-05')
    expect(day).toBe('05')
  })

  it('handles end-of-month correctly', () => {
    const { day, mon } = formatMatchDate('2026-12-31')
    expect(day).toBe('31')
    expect(mon).toBe('DIC')
  })
})

describe('shortTeamName', () => {
  it('replaces AD CEUTA FC with AD Ceuta', () => {
    expect(shortTeamName('AD CEUTA FC')).toBe('Ad Ceuta')
  })

  it('replaces CEUTA FC with AD Ceuta', () => {
    expect(shortTeamName('CEUTA FC')).toBe('Ad Ceuta')
  })

  it('title-cases other team names', () => {
    expect(shortTeamName('MALAGA CF')).toBe('Malaga Cf')
  })

  it('title-cases multi-word names', () => {
    expect(shortTeamName('REAL ZARAGOZA')).toBe('Real Zaragoza')
  })

  it('handles already-cased names without double-lowercasing', () => {
    expect(shortTeamName('SD Huesca')).toBe('Sd Huesca')
  })
})

describe('resultLabel', () => {
  it('returns null for null result', () => {
    expect(resultLabel(null)).toBeNull()
  })

  it('returns null for unknown result code', () => {
    expect(resultLabel('X')).toBeNull()
  })

  it('returns V label for W', () => {
    const r = resultLabel('W')
    expect(r?.label).toBe('V')
    expect(r?.cls).toBe('badge-w')
  })

  it('returns E label for D', () => {
    const r = resultLabel('D')
    expect(r?.label).toBe('E')
    expect(r?.cls).toBe('badge-d')
  })

  it('returns D label for L', () => {
    const r = resultLabel('L')
    expect(r?.label).toBe('D')
    expect(r?.cls).toBe('badge-l')
  })
})
