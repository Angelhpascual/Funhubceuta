import { describe, it, expect } from 'vitest'
import { madridDateTimeToUtc } from '../madridTime'

describe('madridDateTimeToUtc', () => {
  it('converts a CEST (summer, UTC+2) kickoff to the correct UTC instant', () => {
    // 5 Sept 2026, 18:30 Madrid local (CEST) → 16:30 UTC
    const utc = madridDateTimeToUtc('2026-09-05', '18:30')
    expect(utc.toISOString()).toBe('2026-09-05T16:30:00.000Z')
  })

  it('converts a CET (winter, UTC+1) kickoff to the correct UTC instant', () => {
    // 10 Jan 2027, 20:00 Madrid local (CET) → 19:00 UTC
    const utc = madridDateTimeToUtc('2027-01-10', '20:00')
    expect(utc.toISOString()).toBe('2027-01-10T19:00:00.000Z')
  })
})
