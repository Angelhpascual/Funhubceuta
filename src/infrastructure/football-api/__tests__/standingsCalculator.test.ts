import { describe, it, expect } from 'vitest'
import { calculateStandings } from '../standingsCalculator'
import type { OpenFootballMatch } from '../openFootballClient'

const match = (team1: string, team2: string, ft: [number, number]): OpenFootballMatch => ({
  round: '1',
  date: '2025-01-01',
  team1,
  team2,
  score: { ft },
})

describe('calculateStandings', () => {
  it('assigns 3 points to winner, 0 to loser', () => {
    const result = calculateStandings([match('Ceuta', 'Huesca', [2, 0])], '2025-2026')
    const ceuta = result.find((r) => r.teamName === 'Ceuta')!
    const huesca = result.find((r) => r.teamName === 'Huesca')!
    expect(ceuta.points).toBe(3)
    expect(huesca.points).toBe(0)
  })

  it('assigns 1 point each on draw', () => {
    const result = calculateStandings([match('Ceuta', 'Huesca', [1, 1])], '2025-2026')
    expect(result.find((r) => r.teamName === 'Ceuta')!.points).toBe(1)
    expect(result.find((r) => r.teamName === 'Huesca')!.points).toBe(1)
  })

  it('sorts by points descending', () => {
    const matches = [match('Ceuta', 'Huesca', [2, 0]), match('Albacete', 'Oviedo', [1, 1])]
    const result = calculateStandings(matches, '2025-2026')
    expect(result[0].teamName).toBe('Ceuta')
  })

  it('breaks ties by goal difference', () => {
    const matches = [match('Ceuta', 'Huesca', [3, 0]), match('Albacete', 'Oviedo', [1, 0])]
    const result = calculateStandings(matches, '2025-2026')
    expect(result[0].teamName).toBe('Ceuta')
    expect(result[0].goalDifference).toBe(3)
  })

  it('tracks form correctly', () => {
    const matches = [
      match('Ceuta', 'Huesca', [1, 0]),
      match('Ceuta', 'Albacete', [0, 1]),
      match('Ceuta', 'Oviedo', [2, 2]),
    ]
    const result = calculateStandings(matches, '2025-2026')
    expect(result.find((r) => r.teamName === 'Ceuta')!.form).toBe('WLD')
  })

  it('skips matches without score', () => {
    const matches = [{ team1: 'Ceuta', team2: 'Huesca' } as OpenFootballMatch]
    const result = calculateStandings(matches, '2025-2026')
    expect(result).toHaveLength(0)
  })

  it('assigns promotion description to top 2', () => {
    const matches = Array.from({ length: 4 }, (_, i) => match('Ceuta', `Team${i}`, [1, 0]))
    const result = calculateStandings(matches, '2025-2026')
    expect(result[0].description).toBe('Promotion')
  })

  it('generates correct externalId', () => {
    const result = calculateStandings([match('AD Ceuta FC', 'Huesca', [1, 0])], '2025-2026')
    expect(result[0].externalId).toBe('2025-2026-ad-ceuta-fc')
  })
})
