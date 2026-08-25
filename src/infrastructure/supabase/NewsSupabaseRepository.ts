import { supabase } from './client'
import { supabaseAdmin } from './adminClient'
import { ParsedArticle } from '../rss/RssFetcher'
import { NewsItem } from '@/domain/news/News'

export interface NewsImageBackfillRow {
  id: string
  externalId: string
  source: string
  imageUrl: string
}

export class NewsSupabaseRepository {
  // Returns articles that were genuinely new (not previously in DB)
  async upsertArticles(articles: ParsedArticle[]): Promise<ParsedArticle[]> {
    if (articles.length === 0) return []

    // Find which external_ids already exist — use admin client to bypass RLS
    // so discarded articles (published=false) are visible and not re-inserted
    const ids = articles.map((a) => a.externalId)
    const { data: existing } = await supabaseAdmin
      .from('news')
      .select('external_id, image_url')
      .in('external_id', ids)
    const existingMap = new Map(
      (existing ?? []).map((r) => [r.external_id, r.image_url as string | null])
    )
    const newArticles = articles.filter((a) => !existingMap.has(a.externalId))

    // Insert new articles — always unpublished until admin approves from the panel
    if (newArticles.length > 0) {
      const { error } = await supabaseAdmin.from('news').insert(
        newArticles.map((a) => ({
          external_id: a.externalId,
          title: a.title,
          description: a.description,
          url: a.url,
          image_url: a.imageUrl,
          source: a.source,
          published_at: a.publishedAt,
          published: false,
        }))
      )
      if (error) throw new Error(`Failed to insert news: ${error.message}`)
    }

    // Update existing articles — never overwrite published or notify_queued (admin may have changed them).
    // Image URL update rules:
    //  - Never overwrite with null (RSS may omit an image that was there before)
    //  - Never replace a Supabase-stored URL with an external one (would lose our CDN copy)
    //  - Allow update only when: new URL is non-null AND existing is null or also external
    const SUPABASE_HOST = 'supabase.co'
    const isSupabaseUrl = (url: string | null) => !!url && url.includes(SUPABASE_HOST)

    const existingArticles = articles.filter((a) => existingMap.has(a.externalId))
    if (existingArticles.length > 0) {
      for (const a of existingArticles) {
        const currentImageUrl = existingMap.get(a.externalId) ?? null
        const update: Record<string, unknown> = {
          title: a.title,
          description: a.description,
          published_at: a.publishedAt,
        }
        if (a.imageUrl && !isSupabaseUrl(currentImageUrl)) {
          update.image_url = a.imageUrl
        }
        await supabaseAdmin.from('news')
          .update(update)
          .eq('external_id', a.externalId)
      }
    }
    return newArticles
  }

  async updateImageUrl(externalId: string, imageUrl: string): Promise<void> {
    await supabaseAdmin.from('news').update({ image_url: imageUrl }).eq('external_id', externalId)
  }

  async updateImageUrlById(id: string, imageUrl: string): Promise<void> {
    await supabaseAdmin.from('news').update({ image_url: imageUrl }).eq('id', id)
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

  // Returns recently published articles with no image URL, newest first
  async getRowsWithoutImages(limit = 20): Promise<{ id: string; url: string }[]> {
    const { data } = await supabaseAdmin
      .from('news')
      .select('id, url')
      .is('image_url', null)
      .not('url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
    return (data ?? []).map((r) => ({ id: r.id, url: r.url }))
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
    const { data } = await supabaseAdmin
      .from('news')
      .select('id, title, source, published_at, image_url, url, published, notify_queued')
      .eq('discarded', false)
      .order('created_at', { ascending: false })
      .limit(limit)
    return data ?? []
  }

  async setDiscarded(id: string): Promise<void> {
    await supabaseAdmin.from('news').update({ notify_queued: false, published: false, discarded: true }).eq('id', id)
  }

  async setPublished(id: string): Promise<void> {
    await supabaseAdmin.from('news').update({ published: true, notify_queued: false }).eq('id', id)
  }

  async clearNotifyQueued(id: string): Promise<void> {
    await supabaseAdmin.from('news').update({ notify_queued: false }).eq('id', id)
  }
}
