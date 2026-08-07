import { supabase } from './client'

export type Tweet = {
  tweet_id: string
  text: string
  created_at_twitter: string
  url: string
  image_url: string | null
}

export async function getLatestTweets(limit = 5): Promise<Tweet[]> {
  const { data } = await supabase
    .from('tweets')
    .select('tweet_id, text, created_at_twitter, url, image_url')
    .order('created_at_twitter', { ascending: false })
    .limit(limit)
  return (data ?? []) as Tweet[]
}

export async function upsertTweets(tweets: {
  tweetId: string
  text: string
  createdAt: string | null
  url: string
  imageUrl: string | null
}[]): Promise<void> {
  if (tweets.length === 0) return
  const { error } = await supabase.from('tweets').upsert(
    tweets.map((t) => ({
      tweet_id: t.tweetId,
      text: t.text,
      created_at_twitter: t.createdAt,
      url: t.url,
      image_url: t.imageUrl,
    })),
    { onConflict: 'tweet_id', ignoreDuplicates: true }
  )
  if (error) throw new Error(`Failed to upsert tweets: ${error.message}`)
}
