import { madridDateTimeToUtc } from './madridTime'

export interface CalendarMatch {
  id: string
  home_team: string
  away_team: string
  date: string
  time: string
  is_home: boolean
  venue: string | null
  espn_event_id: string | null
}

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000

// iCalendar UTC datetime, e.g. "20260920T161500Z"
function icsDateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function buildEvent(m: CalendarMatch): string | null {
  if (!m.date || !m.time) return null

  const rival = m.is_home ? m.away_team : m.home_team
  const summary = m.is_home ? `AD Ceuta vs ${rival}` : `${rival} vs AD Ceuta`
  const start = madridDateTimeToUtc(m.date, m.time)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start.getTime() + MATCH_DURATION_MS)
  const uid = `${m.espn_event_id || m.id}@adceutainfo.com`

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${icsDateTime(new Date())}`,
    `DTSTART:${icsDateTime(start)}`,
    `DTEND:${icsDateTime(end)}`,
    `SUMMARY:${escapeText(summary)}`,
  ]
  if (m.venue) lines.push(`LOCATION:${escapeText(m.venue)}`)
  lines.push(
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(summary)}`,
    'END:VALARM',
    'END:VEVENT'
  )
  return lines.join('\r\n')
}

export function buildCalendarFeed(matches: CalendarMatch[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AD Ceuta FC Info//Calendario de partidos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AD Ceuta FC',
    ...matches.map(buildEvent).filter((e): e is string => e !== null),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}
