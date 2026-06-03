import { MatchEvent } from './lineup/route'

const CEUTA_ID = '5404'

const EVENT_TYPES: Record<string, MatchEvent['type'] | undefined> = {
  'goal': 'goal',
  'yellow-card': 'yellow-card',
  'red-card': 'red-card',
  'substitution': 'substitution',
}

export function parseLineupEvents(
  allEvents: Record<string, unknown>[],
  homeTeamId: string
): MatchEvent[] {
  return allEvents
    .filter(ev => {
      const typeStr = String((ev.type as Record<string, unknown>)?.type ?? '').toLowerCase()
      if (EVENT_TYPES[typeStr] === undefined) return false
      const teamId = String((ev.team as Record<string, unknown>)?.id ?? '')
      return teamId === CEUTA_ID
    })
    .map(ev => {
      const typeStr = String((ev.type as Record<string, unknown>)?.type ?? '').toLowerCase()
      const participants = ev.participants as Record<string, unknown>[] | undefined
      const p0 = participants?.[0]?.athlete as Record<string, unknown> | undefined
      const p1 = participants?.[1]?.athlete as Record<string, unknown> | undefined
      const teamId = String((ev.team as Record<string, unknown>)?.id ?? '')
      const event: MatchEvent = {
        type: EVENT_TYPES[typeStr]!,
        minute: String((ev.clock as Record<string, unknown>)?.displayValue ?? ''),
        playerName: String(p0?.displayName ?? ''),
        team: teamId === homeTeamId ? 'home' : 'away',
      }
      if (typeStr === 'substitution' && p1) {
        event.playerOut = String(p1.displayName ?? '')
      }
      return event
    })
}
