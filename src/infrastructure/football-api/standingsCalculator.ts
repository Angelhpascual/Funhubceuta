import { OpenFootballMatch } from './openFootballClient'
import { StandingEntry } from '@/domain/standings/Standings'

interface TeamStats {
  teamName: string
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  form: string[]
}

export function calculateStandings(
  matches: OpenFootballMatch[],
  season: string
): Omit<StandingEntry, 'id' | 'createdAt' | 'updatedAt'>[] {
  const table = new Map<string, TeamStats>()

  const getOrCreate = (team: string): TeamStats => {
    if (!table.has(team)) {
      table.set(team, {
        teamName: team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        form: [],
      })
    }
    return table.get(team)!
  }

  for (const match of matches) {
    if (!match.score?.ft) continue

    const [g1, g2] = match.score.ft
    const home = getOrCreate(match.team1)
    const away = getOrCreate(match.team2)

    home.played++
    away.played++
    home.goalsFor += g1
    home.goalsAgainst += g2
    away.goalsFor += g2
    away.goalsAgainst += g1

    if (g1 > g2) {
      home.won++
      away.lost++
      home.form.push('W')
      away.form.push('L')
    } else if (g1 < g2) {
      away.won++
      home.lost++
      away.form.push('W')
      home.form.push('L')
    } else {
      home.drawn++
      away.drawn++
      home.form.push('D')
      away.form.push('D')
    }
  }

  const entries = Array.from(table.values())
    .map((t) => ({
      points: t.won * 3 + t.drawn,
      goalDifference: t.goalsFor - t.goalsAgainst,
      ...t,
    }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })

  return entries.map((t, i) => ({
    externalId: `${season}-${t.teamName.toLowerCase().replace(/\s+/g, '-')}`,
    season,
    position: i + 1,
    teamName: t.teamName,
    teamLogo: null,
    played: t.played,
    won: t.won,
    drawn: t.drawn,
    lost: t.lost,
    goalsFor: t.goalsFor,
    goalsAgainst: t.goalsAgainst,
    goalDifference: t.goalDifference,
    points: t.points,
    form: t.form.slice(-5).join(''),
    description: getDescription(i + 1, entries.length),
  }))
}

function getDescription(position: number, total: number): string {
  if (position <= 2) return 'Promotion'
  if (position <= 6) return 'Promotion Playoff'
  if (position >= total - 3) return 'Relegation'
  return ''
}
