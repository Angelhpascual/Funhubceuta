import { describe, it, expect } from 'vitest'
import { parseFormation, assignRows } from '../lineupUtils'
import type { LineupPlayer } from '@/app/api/matches/lineup/route'

function makePlayer(positionAbbr: string, name = positionAbbr): LineupPlayer {
  return {
    name,
    shortName: name,
    jersey: '1',
    position: positionAbbr,
    positionAbbr,
    starter: true,
    photoUrl: null,
  }
}

describe('parseFormation', () => {
  it('parses 4-3-3 into attack-first rows with GK last', () => {
    expect(parseFormation('4-3-3')).toEqual([3, 3, 4, 1])
  })

  it('parses 4-4-2', () => {
    expect(parseFormation('4-4-2')).toEqual([2, 4, 4, 1])
  })

  it('parses 3-5-2', () => {
    expect(parseFormation('3-5-2')).toEqual([2, 5, 3, 1])
  })

  it('parses 4-2-3-1', () => {
    expect(parseFormation('4-2-3-1')).toEqual([1, 3, 2, 4, 1])
  })

  it('always puts 1 as last element (GK row)', () => {
    const result = parseFormation('4-3-3')
    expect(result[result.length - 1]).toBe(1)
  })
})

describe('assignRows', () => {
  it('assigns 11 players to correct rows for 4-3-3', () => {
    const starters: LineupPlayer[] = [
      makePlayer('GK'),
      makePlayer('LB'),
      makePlayer('CB'),
      makePlayer('CB'),
      makePlayer('RB'),
      makePlayer('CM'),
      makePlayer('CM'),
      makePlayer('CM'),
      makePlayer('LW'),
      makePlayer('CF'),
      makePlayer('RW'),
    ]
    const rows = assignRows(starters, '4-3-3')
    expect(rows).toHaveLength(4)
    expect(rows[0]).toHaveLength(3) // forwards
    expect(rows[1]).toHaveLength(3) // midfielders
    expect(rows[2]).toHaveLength(4) // defenders
    expect(rows[3]).toHaveLength(1) // GK
  })

  it('puts GK alone in last row', () => {
    const starters: LineupPlayer[] = [
      makePlayer('GK'),
      makePlayer('LB'),
      makePlayer('CB'),
      makePlayer('CB'),
      makePlayer('RB'),
      makePlayer('CM'),
      makePlayer('CM'),
      makePlayer('CM'),
      makePlayer('LW'),
      makePlayer('CF'),
      makePlayer('RW'),
    ]
    const rows = assignRows(starters, '4-3-3')
    expect(rows[rows.length - 1]).toHaveLength(1)
    expect(rows[rows.length - 1][0].positionAbbr).toBe('GK')
  })

  it('total players across rows equals starters length', () => {
    const starters: LineupPlayer[] = [
      makePlayer('GK'),
      makePlayer('LB'),
      makePlayer('CB'),
      makePlayer('CB'),
      makePlayer('RB'),
      makePlayer('DM'),
      makePlayer('CM'),
      makePlayer('LW'),
      makePlayer('CAM'),
      makePlayer('RW'),
      makePlayer('CF'),
    ]
    const rows = assignRows(starters, '4-2-3-1')
    const total = rows.reduce((sum, r) => sum + r.length, 0)
    expect(total).toBe(11)
  })
})
