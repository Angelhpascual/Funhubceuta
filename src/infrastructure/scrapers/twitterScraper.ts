export interface ScrapedTweet {
  tweetId: string
  text: string
  createdAt: string | null
  url: string
  imageUrl: string | null
}

export async function scrapeLatestTweets(screenName = 'ADCeuta_FC', limit = 10): Promise<ScrapedTweet[]> {
  const html = await new Promise<string>((resolve, reject) => {
    const https = require('https')
    const options = {
      hostname: 'syndication.twitter.com',
      path: `/srv/timeline-profile/screen-name/${screenName}?lang=es`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://twitter.com/',
      },
    }
    const req = https.request(options, (res: NodeJS.ReadableStream & { statusCode: number }) => {
      if (res.statusCode !== 200) { reject(new Error(`Twitter syndication failed: ${res.statusCode}`)); return }
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    })
    req.on('error', reject)
    req.end()
  })

  // Extract JSON data embedded in the page
  // Extract tweet data directly from JSON fragments
  const tweets: ScrapedTweet[] = []
  const idPattern = /"id_str":"(\d+)"/g
  const textPattern = /"full_text":"((?:[^"\\]|\\.)*)"/g
  const datePattern = /"created_at":"([^"]+)"/g
  const mediaPattern = /"media_url_https":"([^"]+)"/g

  const ids: string[] = []
  const texts: string[] = []
  const dates: string[] = []
  const images: string[] = []

  let m
  while ((m = idPattern.exec(html)) !== null) ids.push(m[1])
  while ((m = textPattern.exec(html)) !== null) texts.push(m[1])
  while ((m = datePattern.exec(html)) !== null) dates.push(m[1])
  while ((m = mediaPattern.exec(html)) !== null) images.push(m[1])

  const seen = new Set<string>()
  const len = Math.min(ids.length, texts.length, limit)

  for (let i = 0; i < len; i++) {
    const id = ids[i]
    if (seen.has(id)) continue
    seen.add(id)

    const rawText = texts[i]
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\/g, '')
      // Remove t.co links
      .replace(/https?:\/\/t\.co\/\S+/g, '')
      .trim()

    if (!rawText) continue

    tweets.push({
      tweetId: id,
      text: rawText,
      createdAt: dates[i] ? new Date(dates[i]).toISOString() : null,
      url: `https://twitter.com/${screenName}/status/${id}`,
      imageUrl: images[i] ?? null,
    })
  }

  return tweets
}
