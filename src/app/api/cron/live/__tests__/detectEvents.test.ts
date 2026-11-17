import { describe, it, expect } from 'vitest'
import { detectEvents } from '../detectEvents'
import type { MatchState } from '../detectEvents'
import type { LiveMatch } from '@/domain/match/LiveMatch'

function makeMatch(overrides: Partial<LiveMatch> = {}): LiveMatch {
  return {
    espnId: '1',
    state: 'in',
    status: 'En juego',
    clock: "45'",
    homeTeam: 'AD Ceuta FC',
    awayTeam: 'Albacete BP',
    homeScore: 0,
    awayScore: 0,
    events: [],
    venue: 'Estadio Alfonso Murube',
    startDate: '2026-05-25T17:00:00Z',
    ...overrides,
  }
}

function makeState(overrides: Partial<MatchState> = {}): MatchState {
  return {
    espnId: '1',
    homeScore: 0,
    awayScore: 0,
    state: 'in',
    eventCount: 0,
    ...overrides,
  }
}

describe('detectEvents — kickoff', () => {
  it('notifies kickoff when match transitions from pre to in', () => {
    const match = makeMatch({ state: 'in' })
    const prev = makeState({ state: 'pre' })
    const result = detectEvents(match, prev)
    expect(result).toHaveLength(1)
    expect(result[0].tag).toBe('kickoff')
    expect(result[0].title).toContain('en marcha')
  })

  it('notifies kickoff when there is no previous state', () => {
    const match = makeMatch({ state: 'in' })
    const result = detectEvents(match, null)
    expect(result[0].tag).toBe('kickoff')
  })

  it('does not notify kickoff if match was already in', () => {
    const match = makeMatch({ state: 'in' })
    const prev = makeState({ state: 'in' })
    const result = detectEvents(match, prev)
    expect(result.find((n) => n.tag === 'kickoff')).toBeUndefined()
  })
})

describe('detectEvents — goals', () => {
  it('notifies Ceuta goal when Ceuta is home and home score increases', () => {
    const match = makeMatch({ homeScore: 1, awayScore: 0 })
    const prev = makeState({ homeScore: 0, awayScore: 0 })
    const result = detectEvents(match, prev)
    expect(result).toHaveLength(1)
    expect(result[0].title).toContain('GOOOOOL DE CEUTA')
    expect(result[0].tag).toBe('goal-home-1')
  })

  it('notifies goal against when rival scores and Ceuta is home', () => {
    const match = makeMatch({ homeScore: 0, awayScore: 1 })
    const prev = makeState({ homeScore: 0, awayScore: 0 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('Gol en contra')
  })

  it('notifies Ceuta goal when Ceuta is away and away score increases', () => {
    const match = makeMatch({
      homeTeam: 'Albacete BP',
      awayTeam: 'AD Ceuta FC',
      homeScore: 0,
      awayScore: 1,
    })
    const prev = makeState({ homeScore: 0, awayScore: 0 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('GOOOOOL DE CEUTA')
  })

  it('notifies goal against when rival scores and Ceuta is away', () => {
    const match = makeMatch({
      homeTeam: 'Albacete BP',
      awayTeam: 'AD Ceuta FC',
      homeScore: 1,
      awayScore: 0,
    })
    const prev = makeState({ homeScore: 0, awayScore: 0 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('Gol en contra')
  })

  it('includes scorer name when available', () => {
    const match = makeMatch({
      homeScore: 1,
      events: [{ type: 'goal', team: 'home', minute: "23'", playerName: 'Juanito' }],
    })
    const prev = makeState({ homeScore: 0 })
    const result = detectEvents(match, prev)
    expect(result[0].body).toContain('Juanito')
  })

  it('notifies multiple goals in one polling cycle', () => {
    const match = makeMatch({ homeScore: 2, awayScore: 0 })
    const prev = makeState({ homeScore: 0, awayScore: 0 })
    const result = detectEvents(match, prev)
    expect(result).toHaveLength(2)
    expect(result.every((n) => n.title.includes('GOOOOOL'))).toBe(true)
  })

  it('attributes each goal to its own scorer and gives each a distinct tag when two goals from the same team land in one poll (regression: used to attribute both to whichever goal was last overall, and both got the same tag, so push platforms that dedupe by tag only ever showed one)', () => {
    const match = makeMatch({
      homeScore: 2,
      awayScore: 0,
      events: [
        { type: 'goal', team: 'home', minute: "10'", playerName: 'Primero' },
        { type: 'goal', team: 'home', minute: "40'", playerName: 'Segundo' },
      ],
    })
    const prev = makeState({ homeScore: 0, awayScore: 0, eventCount: 0 })
    const result = detectEvents(match, prev)
    expect(result).toHaveLength(2)
    expect(result[0].body).toContain('Primero')
    expect(result[1].body).toContain('Segundo')
    expect(result[0].tag).not.toBe(result[1].tag)
    expect(result[0].tag).toBe('goal-home-1')
    expect(result[1].tag).toBe('goal-home-2')
  })

  it('does not notify goals when match is pre', () => {
    const match = makeMatch({ state: 'pre', homeScore: 0, awayScore: 0 })
    const prev = makeState({ state: 'pre' })
    const result = detectEvents(match, prev)
    expect(result.find((n) => n.tag.startsWith('goal'))).toBeUndefined()
  })
})

describe('detectEvents — red cards', () => {
  it('notifies red card for Ceuta player', () => {
    const match = makeMatch({
      events: [{ type: 'redCard', team: 'home', minute: "55'", playerName: 'López' }],
    })
    const prev = makeState({ eventCount: 0 })
    const result = detectEvents(match, prev)
    expect(result.find((n) => n.title.includes('quedamos con 10'))).toBeDefined()
  })

  it('notifies red card for rival player', () => {
    const match = makeMatch({
      events: [{ type: 'redCard', team: 'away', minute: "60'", playerName: 'Martínez' }],
    })
    const prev = makeState({ eventCount: 0 })
    const result = detectEvents(match, prev)
    expect(result.find((n) => n.title.includes('Roja para el rival'))).toBeDefined()
  })

  it('only notifies new red cards (not already seen events)', () => {
    const match = makeMatch({
      events: [
        { type: 'redCard', team: 'away', minute: "30'", playerName: 'Old' },
        { type: 'redCard', team: 'away', minute: "60'", playerName: 'New' },
      ],
    })
    const prev = makeState({ eventCount: 1 }) // first card already seen
    const result = detectEvents(match, prev)
    const redCards = result.filter((n) => n.tag.startsWith('red-'))
    expect(redCards).toHaveLength(1)
    expect(redCards[0].body).toContain('New')
  })
})

describe('detectEvents — fulltime', () => {
  it('notifies victory when Ceuta wins', () => {
    const match = makeMatch({ state: 'post', homeScore: 2, awayScore: 1 })
    const prev = makeState({ state: 'in', homeScore: 2, awayScore: 1 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('VICTORIA')
    expect(result[0].tag).toBe('fulltime')
  })

  it('notifies defeat when Ceuta loses', () => {
    const match = makeMatch({ state: 'post', homeScore: 0, awayScore: 2 })
    const prev = makeState({ state: 'in', homeScore: 0, awayScore: 2 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('Derrota')
  })

  it('notifies draw', () => {
    const match = makeMatch({ state: 'post', homeScore: 1, awayScore: 1 })
    const prev = makeState({ state: 'in', homeScore: 1, awayScore: 1 })
    const result = detectEvents(match, prev)
    expect(result[0].title).toContain('Empate')
  })

  it('does not notify fulltime if previous state was not in', () => {
    const match = makeMatch({ state: 'post', homeScore: 1, awayScore: 0 })
    const prev = makeState({ state: 'pre' })
    const result = detectEvents(match, prev)
    expect(result.find((n) => n.tag === 'fulltime')).toBeUndefined()
  })
})
