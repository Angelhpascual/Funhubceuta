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

  const TEAM_NAMES: Record<string, string> = {
    Spain: 'España',
    'Spain U23': 'España SUB-23',
    'Spain U21': 'España SUB-21',
    'Spain U20': 'España SUB-20',
    'Spain U19': 'España SUB-19',
    'Spain U18': 'España SUB-18',
    France: 'Francia',
    'France U23': 'Francia SUB-23',
    'France U21': 'Francia SUB-21',
    'France U20': 'Francia SUB-20',
    'France U19': 'Francia SUB-19',
    Argentina: 'Argentina',
    'Argentina U23': 'Argentina SUB-23',
    'Argentina U20': 'Argentina SUB-20',
    Brazil: 'Brasil',
    'Brazil U20': 'Brasil SUB-20',
    'Brazil U23': 'Brasil SUB-23',
    Portugal: 'Portugal',
    'Portugal U21': 'Portugal SUB-21',
    'Portugal U20': 'Portugal SUB-20',
    Morocco: 'Marruecos',
    'Morocco U23': 'Marruecos SUB-23',
    Senegal: 'Senegal',
    Mali: 'Mali',
    Guinea: 'Guinea',
    Colombia: 'Colombia',
    'Colombia U20': 'Colombia SUB-20',
    Uruguay: 'Uruguay',
    'Uruguay U20': 'Uruguay SUB-20',
    Cameroon: 'Camerún',
    Algeria: 'Argelia',
    Nigeria: 'Nigeria',
    Ghana: 'Ghana',
    'Ivory Coast': 'Costa de Marfil',
    'United States': 'Estados Unidos',
    'United States U20': 'Estados Unidos SUB-20',
    'United States U23': 'Estados Unidos SUB-23',
    'United States U18': 'Estados Unidos SUB-18',
    'Burkina Faso': 'Burkina Faso',
  }

  function translateName(name: string): string {
    if (TEAM_NAMES[name]) return TEAM_NAMES[name]
    // Generic pattern: "Country U##"
    const match = name.match(/^(.+?)\s+U(\d{2})$/)
    if (match) {
      const base = TEAM_NAMES[match[1]] ?? match[1]
      return `${base} SUB-${match[2]}`
    }
    return name
  }

  return teamHistory.map((t) => ({
    club: translateName(t.displayName),
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
