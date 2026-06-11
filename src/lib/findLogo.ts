const STOPWORDS = new Set([
  'fc',
  'cf',
  'ad',
  'sd',
  'ud',
  'cd',
  'rc',
  'real',
  'atletico',
  'deportivo',
  'balompie',
  'bp',
  'club',
])

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

function keywords(name: string): string[] {
  return norm(name)
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

export function findLogo(logos: Record<string, string>, name: string): string | null {
  if (!name) return null

  const target = norm(name)
  const targetKws = keywords(name)

  for (const [teamName, logo] of Object.entries(logos)) {
    const n = norm(teamName)
    const nKws = keywords(teamName)

    // Exact normalized match
    if (n === target) return logo

    // Substring match
    if (target.includes(n) || n.includes(target)) return logo

    // Keyword overlap — if any significant keyword matches
    if (targetKws.some((kw) => nKws.includes(kw))) return logo
  }

  return null
}
