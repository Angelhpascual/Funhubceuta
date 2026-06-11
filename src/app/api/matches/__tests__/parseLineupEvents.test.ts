import { describe, it, expect } from 'vitest'
import { parseLineupEvents } from '../parseLineupEvents'

const CEUTA_ID = '5404'
const RIVAL_ID = '9999'
const HOME_ID = CEUTA_ID

function makeEvent(
  overrides: {
    type?: string
    teamId?: string
    minute?: string
    player0?: string
    player1?: string
  } = {}
) {
  const {
    type = 'goal',
    teamId = CEUTA_ID,
    minute = "17'",
    player0 = 'Marcos Fernández',
    player1,
  } = overrides
  return {
    type: { type },
    team: { id: teamId },
    clock: { displayValue: minute },
    participants: [
      { athlete: { displayName: player0 } },
      ...(player1 ? [{ athlete: { displayName: player1 } }] : []),
    ],
  }
}

describe('parseLineupEvents', () => {
  it('parses a goal event', () => {
    const events = parseLineupEvents([makeEvent({ type: 'goal' })], HOME_ID)
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('goal')
    expect(events[0].playerName).toBe('Marcos Fernández')
    expect(events[0].minute).toBe("17'")
  })

  it('parses yellow-card event', () => {
    const events = parseLineupEvents([makeEvent({ type: 'yellow-card' })], HOME_ID)
    expect(events[0].type).toBe('yellow-card')
  })

  it('parses red-card event', () => {
    const events = parseLineupEvents([makeEvent({ type: 'red-card' })], HOME_ID)
    expect(events[0].type).toBe('red-card')
  })

  it('parses substitution with playerOut', () => {
    const events = parseLineupEvents(
      [makeEvent({ type: 'substitution', player0: 'Salvi', player1: 'Rubén Díez' })],
      HOME_ID
    )
    expect(events[0].type).toBe('substitution')
    expect(events[0].playerName).toBe('Salvi')
    expect(events[0].playerOut).toBe('Rubén Díez')
  })

  it('marks event as home when teamId matches homeTeamId', () => {
    const events = parseLineupEvents([makeEvent({ teamId: HOME_ID })], HOME_ID)
    expect(events[0].team).toBe('home')
  })

  it('marks event as away when teamId does not match homeTeamId', () => {
    const events = parseLineupEvents([makeEvent({ teamId: CEUTA_ID })], RIVAL_ID)
    expect(events[0].team).toBe('away')
  })

  it('filters out events from rival team', () => {
    const events = parseLineupEvents(
      [makeEvent({ teamId: CEUTA_ID }), makeEvent({ teamId: RIVAL_ID })],
      HOME_ID
    )
    expect(events).toHaveLength(1)
  })

  it('filters out unknown event types', () => {
    const events = parseLineupEvents(
      [makeEvent({ type: 'corner-kick' }), makeEvent({ type: 'goal' })],
      HOME_ID
    )
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('goal')
  })

  it('returns empty array for no events', () => {
    expect(parseLineupEvents([], HOME_ID)).toEqual([])
  })

  it('handles multiple events in order', () => {
    const events = parseLineupEvents(
      [
        makeEvent({ type: 'goal', minute: "17'" }),
        makeEvent({ type: 'yellow-card', minute: "45'" }),
        makeEvent({ type: 'substitution', minute: "67'", player0: 'Salvi', player1: 'Lachhab' }),
      ],
      HOME_ID
    )
    expect(events).toHaveLength(3)
    expect(events.map((e) => e.type)).toEqual(['goal', 'yellow-card', 'substitution'])
  })
})
