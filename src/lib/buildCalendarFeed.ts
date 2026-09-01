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
const REMINDER_DURATION_MS = 15 * 60 * 1000

// Estimated full-time: two 45' halves + halftime break + typical stoppage
// time. The .ics feed can't know the real final whistle (unlike the
// in-app cron, which detects it live from ESPN) — this is a best-effort
// estimate, called out as such in the event description.
const MVP_OPEN_AFTER_KICKOFF_MS = 110 * 60 * 1000
const MVP_VOTING_WINDOW_MS = 48 * 60 * 60 * 1000
const QUINIELA_OPEN_BEFORE_KICKOFF_MS = 3 * 24 * 60 * 60 * 1000

// iCalendar UTC datetime, e.g. "20260920T161500Z"
function icsDateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function vevent(opts: {
  uid: string
  start: Date
  end: Date
  summary: string
  description?: string
  location?: string
  alarmTrigger?: string
}): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${icsDateTime(new Date())}`,
    `DTSTART:${icsDateTime(opts.start)}`,
    `DTEND:${icsDateTime(opts.end)}`,
    `SUMMARY:${escapeText(opts.summary)}`,
  ]
  if (opts.location) lines.push(`LOCATION:${escapeText(opts.location)}`)
  if (opts.description) lines.push(`DESCRIPTION:${escapeText(opts.description)}`)
  if (opts.alarmTrigger) {
    lines.push(
      'BEGIN:VALARM',
      `TRIGGER:${opts.alarmTrigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(opts.summary)}`,
      'END:VALARM'
    )
  }
  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

function rivalLabel(m: CalendarMatch): string {
  const rival = m.is_home ? m.away_team : m.home_team
  return m.is_home ? `AD Ceuta vs ${rival}` : `${rival} vs AD Ceuta`
}

function buildMatchEvent(m: CalendarMatch, kickoff: Date): string {
  const label = rivalLabel(m)
  const end = new Date(kickoff.getTime() + MATCH_DURATION_MS)
  const uid = `${m.espn_event_id || m.id}@adceutainfo.com`
  return vevent({ uid, start: kickoff, end, summary: label, location: m.venue ?? undefined, alarmTrigger: '-P1D' })
}

function buildManagementEvents(m: CalendarMatch, kickoff: Date): string[] {
  const label = rivalLabel(m)
  const uidBase = m.espn_event_id || m.id

  const mvpOpen = new Date(kickoff.getTime() + MVP_OPEN_AFTER_KICKOFF_MS)
  const mvpClose = new Date(mvpOpen.getTime() + MVP_VOTING_WINDOW_MS)
  const quinielaOpen = new Date(kickoff.getTime() - QUINIELA_OPEN_BEFORE_KICKOFF_MS)

  return [
    vevent({
      uid: `mvp-open-${uidBase}@adceutainfo.com`,
      start: mvpOpen,
      end: new Date(mvpOpen.getTime() + REMINDER_DURATION_MS),
      summary: `⭐ Abrir MVP — ${label}`,
      description: 'Hora estimada de final del partido (puede variar). Elige candidatos y abre la votación.',
      alarmTrigger: 'PT0S',
    }),
    vevent({
      uid: `mvp-close-${uidBase}@adceutainfo.com`,
      start: mvpClose,
      end: new Date(mvpClose.getTime() + REMINDER_DURATION_MS),
      summary: `🏆 Cerrar MVP — ${label}`,
      description: 'Cierra la votación MVP y proclama al ganador.',
      alarmTrigger: 'PT0S',
    }),
    vevent({
      uid: `quiniela-open-${uidBase}@adceutainfo.com`,
      start: quinielaOpen,
      end: new Date(quinielaOpen.getTime() + REMINDER_DURATION_MS),
      summary: `🔮 Abrir quiniela — ${label}`,
      description: 'Crea la predicción de resultado para este partido.',
      alarmTrigger: 'PT0S',
    }),
    vevent({
      uid: `quiniela-close-${uidBase}@adceutainfo.com`,
      start: kickoff,
      end: new Date(kickoff.getTime() + REMINDER_DURATION_MS),
      summary: `🔒 Cerrar quiniela — ${label}`,
      description: 'La quiniela se cierra al pitido inicial — publica el resultado cuando acabe el partido.',
      alarmTrigger: 'PT0S',
    }),
  ]
}

function buildEventsForMatch(m: CalendarMatch): string[] {
  if (!m.date || !m.time) return []
  const kickoff = madridDateTimeToUtc(m.date, m.time)
  if (Number.isNaN(kickoff.getTime())) return []
  return [buildMatchEvent(m, kickoff), ...buildManagementEvents(m, kickoff)]
}

export function buildCalendarFeed(matches: CalendarMatch[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AD Ceuta FC Info//Calendario de partidos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:AD Ceuta FC',
    ...matches.flatMap(buildEventsForMatch),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n') + '\r\n'
}
