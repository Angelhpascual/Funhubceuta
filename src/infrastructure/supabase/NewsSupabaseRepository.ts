import { supabase } from './client'
import { ParsedArticle } from '../rss/RssFetcher'
import { NewsItem } from '@/domain/news/News'

export class NewsSupabaseRepository {
  async upsertArticles(articles: ParsedArticle[]): Promise<void> {
    if (articles.length === 0) return

    const { error } = await supabase.from('news').upsert(
      articles.map((a) => ({
        external_id: a.externalId,
        title: a.title,
        description: a.description,
        url: a.url,
        image_url: a.imageUrl,
        source: a.source,
        published_at: a.publishedAt,
      })),
      { onConflict: 'external_id', ignoreDuplicates: true }
    )

    if (error) throw new Error(`Failed to upsert news: ${error.message}`)
  }

  async getLatest(limit = 10): Promise<NewsItem[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.description,
      url: row.url,
      source: row.source,
      sourceUrl: null,
      imageUrl: row.image_url,
      publishedAt: row.published_at,
      createdAt: row.created_at,
    }))
  }
}
