const BASE_URL = process.env.NEXT_PUBLIC_THESPORTSDB_BASE_URL!
const LEAGUE_ID = process.env.NEXT_PUBLIC_SEGUNDA_DIVISION_LEAGUE_ID!
const TEAM_ID = process.env.NEXT_PUBLIC_AD_CEUTA_TEAM_ID!

async function fetcher<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`TheSportsDB error: ${res.status}`)
  return res.json()
}

export const theSportsDbClient = {
  getStandings: (season: string) => fetcher(`/lookuptable.php?l=${LEAGUE_ID}&s=${season}`),

  getTeamMatches: (season: string) => fetcher(`/searchevents.php?id=${TEAM_ID}&s=${season}`),

  getNextMatches: () => fetcher(`/eventsnext.php?id=${TEAM_ID}`),

  getLastMatches: () => fetcher(`/eventslast.php?id=${TEAM_ID}`),

  getTeamSquad: () => fetcher(`/lookup_all_players.php?id=${TEAM_ID}`),

  getTeamInfo: () => fetcher(`/lookupteam.php?id=${TEAM_ID}`),
}
