import { NextResponse } from 'next/server'

// Master sync endpoint — runs all scrapers in sequence
// Usage: GET /api/sync?secret=ceuta2026 (local) or POST from QStash (production)

async function runSync(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (process.env.NODE_ENV === 'production' && secret !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  // 1. Standings (ESPN — fast, no Puppeteer)
  try {
    const res = await fetch(`${getBase(request)}/api/standings/sync`, { method: 'POST' })
    results.standings = await res.json()
  } catch (err) {
    results.standings = { error: String(err) }
  }

  // 2. News
  try {
    const res = await fetch(`${getBase(request)}/api/cron/news`)
    results.news = await res.json()
  } catch (err) {
    results.news = { error: String(err) }
  }

  // 3. Matches (Puppeteer — may timeout in prod)
  try {
    const res = await fetch(`${getBase(request)}/api/cron/matches`)
    results.matches = await res.json()
  } catch (err) {
    results.matches = { error: String(err) }
  }

  // 4. Player stats (LaLiga HTML scrape — no Puppeteer)
  try {
    const res = await fetch(`${getBase(request)}/api/cron/stats?secret=${secret ?? ''}`)
    results.stats = await res.json()
  } catch (err) {
    results.stats = { error: String(err) }
  }

  return NextResponse.json({ ok: true, results })
}

export const GET = runSync
export const POST = runSync

function getBase(request: Request): string {
  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}
