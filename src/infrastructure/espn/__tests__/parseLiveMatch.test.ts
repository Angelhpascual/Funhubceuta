import { describe, it, expect } from 'vitest'
import { findCeutaEvent, parseMatchCore, guardMatchState, parseLiveEvents } from '../parseLiveMatch'

function makeScoreboard(state: string) {
  return {
    events: [{
      id: 'evt1',
      date: '2026-09-20T18:30Z',
      competitions: [{
        status: { type: { state, description: state }, displayClock: "23'" },
        venue: { fullName: 'Alfonso Murube' },
        competitors: [
          { homeAway: 'home', team: { id: '5404', displayName: 'Ceuta' }, score: '2' },
          { homeAway: 'away', team: { id: '95', displayName: 'Real Valladolid' }, score: '1' },
        ],
      }],
    }],
  }
}

describe('findCeutaEvent', () => {
  it('finds the event mentioning Ceuta', () => {
    const found = findCeutaEvent(makeScoreboard('in'))
    expect(found?.id).toBe('evt1')
  })

  it('returns null when no Ceuta event exists', () => {
    expect(findCeutaEvent({ events: [{ id: 'other', competitions: [] }] })).toBeNull()
  })

  it('returns null for a missing/malformed scoreboard', () => {
    expect(findCeutaEvent(null)).toBeNull()
    expect(findCeutaEvent({})).toBeNull()
  })
})

describe('parseMatchCore', () => {
  it('extracts core match fields', () => {
    const event = findCeutaEvent(makeScoreboard('in'))!
    const core = parseMatchCore(event)
    expect(core).toEqual({
      espnId: 'evt1',
      state: 'in',
      status: 'in',
      clock: "23'",
      homeTeamId: '5404',
      awayTeamId: '95',
      homeTeam: 'Ceuta',
      awayTeam: 'Real Valladolid',
      homeScore: 2,
      awayScore: 1,
      venue: 'Alfonso Murube',
      startDate: '2026-09-20T18:30Z',
    })
  })

  it('returns null when the event has no competitions', () => {
    expect(parseMatchCore({ id: 'evt1' })).toBeNull()
  })
})

describe('guardMatchState', () => {
  it('keeps "in" when kickoff was within the last 4 hours', () => {
    const kickoff = new Date(Date.now() - 2 * 3_600_000).toISOString()
    expect(guardMatchState('in', kickoff)).toBe('in')
  })

  it('downgrades "in" to "pre" when kickoff is in the future (ESPN data glitch)', () => {
    const kickoff = new Date(Date.now() + 3_600_000).toISOString()
    expect(guardMatchState('in', kickoff)).toBe('pre')
  })

  it('downgrades "in" to "pre" when kickoff was more than 4 hours ago', () => {
    const kickoff = new Date(Date.now() - 5 * 3_600_000).toISOString()
    expect(guardMatchState('in', kickoff)).toBe('pre')
  })

  it('leaves "in" untouched when there is no DB kickoff to check against', () => {
    expect(guardMatchState('in', null)).toBe('in')
  })

  it('passes through "pre" unchanged regardless of kickoff', () => {
    expect(guardMatchState('pre', null)).toBe('pre')
  })

  it('keeps "post" once kickoff has actually happened', () => {
    const kickoff = new Date(Date.now() - 2 * 3_600_000).toISOString()
    expect(guardMatchState('post', kickoff)).toBe('post')
  })

  it('downgrades "post" to "pre" when kickoff is still in the future (regression: ESPN seeded a corrupt "post" 6min before a real kickoff, so the match was never tracked and live mode never auto-deactivated)', () => {
    const kickoff = new Date(Date.now() + 3_600_000).toISOString()
    expect(guardMatchState('post', kickoff)).toBe('pre')
  })

  it('leaves "post" untouched when there is no DB kickoff to check against', () => {
    expect(guardMatchState('post', null)).toBe('post')
  })
})

describe('parseLiveEvents', () => {
  function makePlay(typeText: string, teamId: string, playerName = 'Jugador') {
    return {
      type: { text: typeText },
      clock: { displayValue: "10'" },
      team: { id: teamId },
      participants: [{ athlete: { displayName: playerName } }],
    }
  }

  it('extracts goal/card events and assigns home/away by team id', () => {
    const summary = { plays: [makePlay('Goal', '5404', 'Marcos'), makePlay('Yellow Card', '95', 'Rival')] }
    const events = parseLiveEvents(summary, '5404')
    expect(events).toEqual([
      { type: 'goal', minute: "10'", team: 'home', playerName: 'Marcos' },
      { type: 'yellowCard', minute: "10'", team: 'away', playerName: 'Rival' },
    ])
  })

  it('classifies red cards', () => {
    const summary = { plays: [makePlay('Red Card', '5404')] }
    expect(parseLiveEvents(summary, '5404')[0].type).toBe('redCard')
  })

  it('excludes substitutions and other play types', () => {
    const summary = { plays: [makePlay('Substitution', '5404'), makePlay('Offside', '5404')] }
    expect(parseLiveEvents(summary, '5404')).toEqual([])
  })

  it('returns an empty array for a missing/malformed summary', () => {
    expect(parseLiveEvents(null, '5404')).toEqual([])
    expect(parseLiveEvents({}, '5404')).toEqual([])
  })
})
