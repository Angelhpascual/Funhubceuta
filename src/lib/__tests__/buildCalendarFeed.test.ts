import { describe, it, expect } from 'vitest'
import { buildCalendarFeed, type CalendarMatch } from '../buildCalendarFeed'

function makeMatch(overrides: Partial<CalendarMatch> = {}): CalendarMatch {
  return {
    id: 'uuid-1',
    home_team: 'Ceuta',
    away_team: 'Real Valladolid',
    date: '2026-09-20',
    time: '16:15',
    is_home: true,
    venue: 'Alfonso Murube',
    espn_event_id: 'espn-123',
    ...overrides,
  }
}

describe('buildCalendarFeed', () => {
  it('wraps events in a valid VCALENDAR envelope', () => {
    const feed = buildCalendarFeed([makeMatch()])
    expect(feed).toMatch(/^BEGIN:VCALENDAR\r\n/)
    expect(feed).toContain('VERSION:2.0')
    expect(feed).toMatch(/END:VCALENDAR\r\n$/)
  })

  it('builds one VEVENT per match with the correct home-team summary', () => {
    const feed = buildCalendarFeed([makeMatch({ is_home: true })])
    expect(feed).toContain('SUMMARY:AD Ceuta vs Real Valladolid')
  })

  it('builds the correct away-team summary', () => {
    const feed = buildCalendarFeed([makeMatch({ is_home: false, home_team: 'Burgos', away_team: 'Ceuta' })])
    expect(feed).toContain('SUMMARY:Burgos vs AD Ceuta')
  })

  it('converts Madrid local kickoff time to the correct UTC DTSTART', () => {
    // 2026-09-20 16:15 Madrid (CEST, UTC+2) → 14:15 UTC
    const feed = buildCalendarFeed([makeMatch({ date: '2026-09-20', time: '16:15' })])
    expect(feed).toContain('DTSTART:20260920T141500Z')
    expect(feed).toContain('DTEND:20260920T161500Z')
  })

  it('uses espn_event_id for a stable UID when present', () => {
    const feed = buildCalendarFeed([makeMatch({ espn_event_id: 'espn-999' })])
    expect(feed).toContain('UID:espn-999@adceutainfo.com')
  })

  it('falls back to the row id when there is no espn_event_id', () => {
    const feed = buildCalendarFeed([makeMatch({ espn_event_id: null, id: 'row-uuid' })])
    expect(feed).toContain('UID:row-uuid@adceutainfo.com')
  })

  it('includes LOCATION when a venue is set', () => {
    const feed = buildCalendarFeed([makeMatch({ venue: 'Estadio José Zorrilla' })])
    expect(feed).toContain('LOCATION:Estadio José Zorrilla')
  })

  it('omits LOCATION when there is no venue', () => {
    const feed = buildCalendarFeed([makeMatch({ venue: null })])
    expect(feed).not.toContain('LOCATION:')
  })

  it('adds a 1-day-before VALARM per event', () => {
    const feed = buildCalendarFeed([makeMatch()])
    expect(feed).toContain('BEGIN:VALARM')
    expect(feed).toContain('TRIGGER:-P1D')
  })

  it('produces an empty-but-valid calendar with zero matches', () => {
    const feed = buildCalendarFeed([])
    expect(feed).not.toContain('BEGIN:VEVENT')
    expect(feed).toContain('BEGIN:VCALENDAR')
  })

  it('skips a match with an empty time instead of crashing the whole feed (regression)', () => {
    // Real case found in dev DB: rows not yet synced can have time: ''
    const feed = buildCalendarFeed([
      makeMatch({ time: '' }),
      makeMatch({ date: '2026-09-27', time: '20:00', away_team: 'Real Sociedad II' }),
    ])
    expect(feed).toContain('BEGIN:VCALENDAR')
    expect(feed).not.toContain('Real Valladolid')
    expect(feed).toContain('Real Sociedad II')
  })

  it('skips a match with an empty date', () => {
    const feed = buildCalendarFeed([makeMatch({ date: '' })])
    expect(feed).not.toContain('BEGIN:VEVENT')
  })
})
