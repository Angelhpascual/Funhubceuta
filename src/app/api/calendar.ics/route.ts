import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { buildCalendarFeed } from '@/lib/buildCalendarFeed'
import { withApi } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

// Public, unauthenticated feed of upcoming fixtures — subscribe once via URL
// from Google/Apple Calendar ("Add calendar by URL") and it stays current
// automatically since it reads straight from the `matches` table.
export const GET = withApi(async () => {
  const matches = await repo.fetchScheduled()
  const feed = buildCalendarFeed(matches)

  return new NextResponse(feed, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="ad-ceuta-fc.ics"',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  })
})
