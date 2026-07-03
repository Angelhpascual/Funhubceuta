import { NextResponse } from 'next/server'
import { getLatestTweets } from '@/infrastructure/supabase/TweetsRepository'

export async function GET() {
  const tweets = await getLatestTweets(5)
  return NextResponse.json({ tweets })
}
