import { NextResponse } from 'next/server'
import { getLatestTweets } from '@/infrastructure/supabase/TweetsRepository'
import { apiError } from '@/lib/apiError'

export async function GET() {
  try {
    const tweets = await getLatestTweets(5)
    return NextResponse.json({ tweets })
  } catch (err) {
    return apiError(err)
  }
}
