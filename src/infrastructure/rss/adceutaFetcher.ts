import { ParsedArticle } from './RssFetcher'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'

function decodeEntities(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/&[a-z]+;/gi, '')
}

interface WPPost {
  id: number
  link: string
  date: string
  title: { rendered: string }
  excerpt: { rendered: string }
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
  }
}

export async function fetchAdceutaOfficialNews(limit = 15): Promise<ParsedArticle[]> {
  const res = await fetch(`https://adceutafc.com/wp-json/wp/v2/posts?per_page=${limit}&_embed=1`, {
    headers: { 'User-Agent': 'FunHubCeuta/1.0' },
    next: { revalidate: 0 },
  })

  if (!res.ok) return []

  const posts: WPPost[] = await res.json()

  // Process posts: download + upload images to Supabase Storage
  const articles = await Promise.all(
    posts.map(async (post) => {
      const rawImageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null
      const title = decodeEntities(post.title.rendered.replace(/<[^>]+>/g, '').trim())
      const description = decodeEntities(
        post.excerpt.rendered.replace(/<[^>]+>/g, '').trim()
      ).slice(0, 300)

      // Download image and store in Supabase Storage to avoid hotlink issues
      let imageUrl: string | null = null
      if (rawImageUrl) {
        imageUrl = await downloadAndUploadImage(rawImageUrl, `adceuta-${post.id}`)
      }

      return {
        externalId: `adceuta-wp-${post.id}`,
        title,
        description: description || null,
        url: post.link,
        imageUrl,
        source: 'oficial',
        publishedAt: new Date(post.date).toISOString(),
      }
    })
  )

  return articles
}
