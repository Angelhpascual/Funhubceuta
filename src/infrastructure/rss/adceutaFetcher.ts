import { ParsedArticle } from './RssFetcher'
import { downloadAndUploadImage } from '@/infrastructure/storage/imageUploader'
import { decodeEntities } from '@/lib/decodeEntities'

interface WPPost {
  id: number
  link: string
  date: string
  date_gmt: string
  title: { rendered: string }
  excerpt: { rendered: string }
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string }>
  }
}

export async function fetchAdceutaOfficialNews(limit = 15): Promise<ParsedArticle[]> {
  const res = await fetch(`https://adceutafc.com/wp-json/wp/v2/posts?per_page=${limit}&_embed=1&_fields=id,link,date,date_gmt,title,excerpt,_embedded`, {
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
        publishedAt: new Date(post.date_gmt + 'Z').toISOString(),
      }
    })
  )

  return articles
}
