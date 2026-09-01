import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MatchesSupabaseRepository', () => {
  const fetchScheduled = vi.fn()
  return {
    MatchesSupabaseRepository: class {
      fetchScheduled = fetchScheduled
      static __fetchScheduled = fetchScheduled
    },
  }
})

import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetchScheduled: ReturnType<typeof vi.fn> = (MatchesSupabaseRepository as any).__fetchScheduled

beforeEach(() => {
  vi.resetAllMocks()
})

describe('GET /api/calendar.ics', () => {
  it('returns a public, unauthenticated text/calendar feed', async () => {
    mockFetchScheduled.mockResolvedValue([{
      id: 'uuid-1', home_team: 'Ceuta', away_team: 'Real Valladolid',
      date: '2026-09-20', time: '16:15', weekday: 'Domingo', is_home: true,
      venue: 'Alfonso Murube', espn_event_id: 'espn-123',
    }])

    const res = await GET()
    const text = await res.text()

    expect(res.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8')
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('SUMMARY:AD Ceuta vs Real Valladolid')
  })

  it('returns a valid empty calendar when there are no scheduled matches', async () => {
    mockFetchScheduled.mockResolvedValue([])
    const res = await GET()
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(text).toContain('BEGIN:VCALENDAR')
  })
})
