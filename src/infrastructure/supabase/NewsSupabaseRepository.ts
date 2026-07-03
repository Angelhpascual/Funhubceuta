import { supabase } from './client'
import { ParsedArticle } from '../rss/RssFetcher'
import { NewsItem } from '@/domain/news/News'

export interface NewsImageBackfillRow {
  id: string
  externalId: string
  source: string
  imageUrl: string
}

export class NewsSupabaseRepository {
  // Sources whose articles are published automatically (no admin approval needed)
  static readonly AUTO_PUBLISH_SOURCES = new Set(['oficial', 'ceutadeportiva'])

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
        published: NewsSupabaseRepository.AUTO_PUBLISH_SOURCES.has(a.source),
      })),
      { onConflict: 'external_id', ignoreDuplicates: false }
    )

    if (error) throw new Error(`Failed to upsert news: ${error.message}`)
    return newArticles
  }

  async updateImageUrl(externalId: string, imageUrl: string): Promise<void> {
    await supabase.from('news').update({ image_url: imageUrl }).eq('external_id', externalId)
  }

  async updateImageUrlById(id: string, imageUrl: string): Promise<void> {
    await supabase.from('news').update({ image_url: imageUrl }).eq('id', id)
  }

  async getLatestRowsWithImages(limit = 20): Promise<NewsImageBackfillRow[]> {
    const { data, error } = await supabase
      .from('news')
      .select('id, external_id, source, image_url')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data
      .filter((row) => row.image_url)
      .map((row) => ({
        id: row.id,
        externalId: row.external_id,
        source: row.source,
        imageUrl: row.image_url,
      }))
  }

  // Returns articles with external (non-Supabase) image URLs, newest first
  async getRowsWithExternalImages(limit = 20): Promise<NewsImageBackfillRow[]> {
    const { data, error } = await supabase
      .from('news')
      .select('id, external_id, source, image_url')
      .not('image_url', 'is', null)
      .not('image_url', 'ilike', '%supabase.co%')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((row) => ({
      id: row.id,
      externalId: row.external_id,
      source: row.source,
      imageUrl: row.image_url,
    }))
  }

  async getLatest(limit = 10, offset = 0): Promise<NewsItem[]> {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
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

  async getAdminList(limit = 100) {
    const { data } = await supabase
      .from('news')
      .select('id, title, source, published_at, image_url, url')
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }
}
