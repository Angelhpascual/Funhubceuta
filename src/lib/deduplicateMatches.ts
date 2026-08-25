type MatchRow = {
  date: string
  home_team: string
  away_team: string
  result: string | null
  status: string
  [key: string]: unknown
}

// Different scrapers name the same club differently (e.g. "AD Ceuta FC" vs "Ceuta",
// "UD Las Palmas" vs "Las Palmas"), so exact-string matching misses real duplicates.
function normalizeTeamName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function teamsMatch(a: string, b: string): boolean {
  const na = normalizeTeamName(a)
  const nb = normalizeTeamName(b)
  return na === nb || na.includes(nb) || nb.includes(na)
}

export function deduplicateMatches<T extends MatchRow>(rows: T[]): T[] {
  const out: T[] = []
  for (const r of rows) {
    const date = String(r.date).slice(0, 10)
    const idx = out.findIndex((o) => {
      if (String(o.date).slice(0, 10) !== date) return false
      const sameOrder = teamsMatch(o.home_team, r.home_team) && teamsMatch(o.away_team, r.away_team)
      const swapped = teamsMatch(o.home_team, r.away_team) && teamsMatch(o.away_team, r.home_team)
      return sameOrder || swapped
    })
    if (idx === -1) {
      out.push(r)
    } else if (!out[idx].result && r.result) {
      out[idx] = r
    }
  }
  return out
}
