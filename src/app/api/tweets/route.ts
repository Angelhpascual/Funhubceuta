import { NextResponse } from 'next/server'
import { getLatestTweets } from '@/infrastructure/supabase/TweetsRepository'
import { apiError } from '@/lib/apiError'

export async function GET() {
  try {
    const tweets = await getLatestTweets(5)
    return NextResponse.json({ tweets }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } })
  } catch (err) {
    return apiError(err)
  }
}
