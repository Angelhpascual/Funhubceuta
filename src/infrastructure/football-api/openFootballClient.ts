const BASE_URL = 'https://raw.githubusercontent.com/openfootball/football.json/master'

export interface OpenFootballMatch {
  round: string
  date: string
  time?: string
  team1: string
  team2: string
  score?: {
    ht?: [number, number]
    ft?: [number, number]
  }
}

export interface OpenFootballData {
  name: string
  matches: OpenFootballMatch[]
}

export async function getSegundaDivisionMatches(season: string): Promise<OpenFootballData> {
  // season format: '2025-2026' -> '2025-26'
  const [start, end] = season.split('-')
  const folderSeason = `${start}-${end.slice(2)}`

  const res = await fetch(`${BASE_URL}/${folderSeason}/es.2.json`, {
    next: { revalidate: 3600 },
  })

  if (!res.ok) throw new Error(`openfootball error: ${res.status}`)
  return res.json()
}
