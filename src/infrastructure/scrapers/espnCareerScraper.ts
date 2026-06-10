export interface CareerEntry {
  club: string
  seasons: string
  logo: string | null
}

export async function scrapeCareerHistory(espnId: string): Promise<CareerEntry[]> {
  const res = await fetch(
    `https://site.api.espn.com/apis/common/v3/sports/soccer/athletes/${espnId}/bio`
  )
  if (!res.ok) return []

  const data = await res.json()
  const teamHistory: Array<{
    displayName: string
    seasons: string
    logo?: string
    seasonCount?: string
  }> = data.teamHistory ?? []

  const NATIONAL_TEAMS = ['Spain', 'France', 'Argentina', 'Brazil', 'Portugal', 'Morocco',
    'Senegal', 'Mali', 'Guinea', 'Colombia', 'Uruguay', 'Cameroon', 'Algeria', 'Nigeria', 'Ghana',
    'Ivory Coast', 'Costa de Marfil']

  return teamHistory
    .filter(t => !NATIONAL_TEAMS.some(n => t.displayName.startsWith(n)))
    .map(t => ({
      club: t.displayName,
      seasons: (t.seasons ?? '').replace(/CURRENT/g, 'Act.'),
      logo: t.logo ?? null,
    }))
}

export async function fetchEspnRoster(): Promise<{ espnId: string; name: string }[]> {
  const res = await fetch(
    'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2/teams/5404/roster'
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.athletes ?? []).map((a: { id: string; displayName: string }) => ({
    espnId: String(a.id),
    name: a.displayName,
  }))
}
