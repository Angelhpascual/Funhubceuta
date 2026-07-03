type MatchRow = {
  date: string
  home_team: string
  away_team: string
  result: string | null
  status: string
  [key: string]: unknown
}

export function deduplicateMatches<T extends MatchRow>(rows: T[]): T[] {
  return Object.values(
    rows.reduce<Record<string, T>>((acc, r) => {
      const key = `${String(r.date).slice(0, 10)}_${r.home_team}_${r.away_team}`
      if (!acc[key] || (!acc[key].result && r.result)) acc[key] = r
      return acc
    }, {})
  )
}
