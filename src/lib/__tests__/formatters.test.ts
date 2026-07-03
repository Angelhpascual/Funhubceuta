import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { timeAgo, fmtDate, fmtDuration } from '../formatters'

describe('timeAgo', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('returns empty string for null/undefined', () => {
    expect(timeAgo(null)).toBe('')
    expect(timeAgo(undefined)).toBe('')
  })

  it('returns "Ahora" for < 1 minute ago', () => {
    vi.setSystemTime(new Date('2026-01-01T12:00:30Z'))
    expect(timeAgo('2026-01-01T12:00:00Z')).toBe('Ahora')
  })

  it('returns minutes', () => {
    vi.setSystemTime(new Date('2026-01-01T12:05:00Z'))
    expect(timeAgo('2026-01-01T12:00:00Z')).toBe('Hace 5m')
  })

  it('returns hours', () => {
    vi.setSystemTime(new Date('2026-01-01T15:00:00Z'))
    expect(timeAgo('2026-01-01T12:00:00Z')).toBe('Hace 3h')
  })

  it('returns days', () => {
    vi.setSystemTime(new Date('2026-01-04T12:00:00Z'))
    expect(timeAgo('2026-01-01T12:00:00Z')).toBe('Hace 3d')
  })
})

describe('fmtDate', () => {
  it('returns "—" for null/undefined', () => {
    expect(fmtDate(null)).toBe('—')
    expect(fmtDate(undefined)).toBe('—')
  })

  it('returns a string containing time digits', () => {
    const result = fmtDate('2026-06-15T10:30:00Z')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(4)
    expect(result).toMatch(/\d+/)
  })
})

describe('fmtDuration', () => {
  it('returns "—" for null/undefined/0', () => {
    expect(fmtDuration(null)).toBe('—')
    expect(fmtDuration(undefined)).toBe('—')
    expect(fmtDuration(0)).toBe('—')
  })

  it('formats milliseconds under 1s', () => {
    expect(fmtDuration(450)).toBe('450ms')
  })

  it('formats seconds', () => {
    expect(fmtDuration(2500)).toBe('2.5s')
  })
})
