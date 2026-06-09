import { supabase } from './client'
import { ParsedArticle } from '../rss/RssFetcher'
import { NewsItem } from '@/domain/news/News'

export class NewsSupabaseRepository {
  // Returns articles that were genuinely new (not previously in DB)
  async upsertArticles(articles: ParsedArticle[]): Promise<ParsedArticle[]> {
    if (articles.length === 0) return []

    // Find which external_ids already exist
    const ids = articles.map((a) => a.externalId)
    const { data: existing } = await supabase
      .from('news')
      .select('external_id')
      .in('external_id', ids)
    const existingIds = new Set((existing ?? []).map((r) => r.external_id))
    const newArticles = articles.filter((a) => !existingIds.has(a.externalId))

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
      { onConflict: 'external_id', ignoreDuplicates: false }
    )

    if (error) throw new Error(`Failed to upsert news: ${error.message}`)
    return newArticles
  }

  async updateImageUrl(externalId: string, imageUrl: string): Promise<void> {
    await supabase.from('news').update({ image_url: imageUrl }).eq('external_id', externalId)
  }

  async getLatest(limit = 10, offset = 0): Promise<NewsItem[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

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
