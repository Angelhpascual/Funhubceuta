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
    // so discarded articles (published=false) are visible and not re-inserted.
    // This is only used for the image-merge decision below, NOT to decide
    // which articles are new — see the upsert comment for why.
    const ids = articles.map((a) => a.externalId)
    const { data: existing } = await supabaseAdmin
      .from('news')
      .select('external_id, image_url')
      .in('external_id', ids)
    const existingMap = new Map(
      (existing ?? []).map((r) => [r.external_id, r.image_url as string | null])
    )

    // Insert new articles atomically via ON CONFLICT DO NOTHING (ignoreDuplicates)
    // instead of a separate SELECT-then-INSERT — that had a TOCTOU window where
    // two overlapping cron runs (e.g. a slow run + a QStash retry) could both
    // see the same article as "not existing yet" and both insert it, producing
    // a duplicate `news` row and a duplicate push notification. `.select()`
    // after an ignoreDuplicates upsert returns only the rows actually inserted,
    // so `newArticles` below reflects reality even under a race — always
    // unpublished until admin approves from the panel.
    const { data: insertedRows, error } = await supabaseAdmin.from('news')
      .upsert(
        articles.map((a) => ({
          external_id: a.externalId,
          title: a.title,
          description: a.description,
          url: a.url,
          image_url: a.imageUrl,
          source: a.source,
          published_at: a.publishedAt,
          published: false,
        })),
        { onConflict: 'external_id', ignoreDuplicates: true }
      )
      .select('external_id')
    if (error) throw new Error(`Failed to insert news: ${error.message}`)

    const insertedIds = new Set((insertedRows ?? []).map((r) => r.external_id as string))
    const newArticles = articles.filter((a) => insertedIds.has(a.externalId))

    // Update existing articles — never overwrite published or notify_queued (admin may have changed them).
    // Image URL update rules:
    //  - Never overwrite with null (RSS may omit an image that was there before)
    //  - Never replace a Supabase-stored URL with an external one (would lose our CDN copy)
    //  - Allow update only when: new URL is non-null AND existing is null or also external
    const SUPABASE_HOST = 'supabase.co'
    const isSupabaseUrl = (url: string | null) => !!url && url.includes(SUPABASE_HOST)

    // Derived from the upsert result, not existingMap — an article can be
    // "existing" here without an existingMap entry if it was inserted by a
    // concurrent run between our SELECT above and the upsert (rare); in that
    // case currentImageUrl below falls back to null, which only affects
    // whether a fresh image URL gets written, nothing destructive.
    const existingArticles = articles.filter((a) => !insertedIds.has(a.externalId))
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

  // Returns articles with external (non-Supabase) image URLs, newest first.
  // Excludes anything older than 3 days — backfill-images retries this list
  // every 6h with no success/failure tracking, so a permanently-unreachable
  // source (confirmed: every "fetch failed" error logged under
  // cron_type='image-download-error' is laverdaddeceuta.com, consistently,
  // for days) got retried forever, burning function time and flooding the
  // logs (877 error rows for ~10 distinct URLs) while never succeeding.
  // After 3 days we accept the original external URL as the permanent image
  // — same visual result users already saw, just not mirrored to our CDN.
  async getRowsWithExternalImages(limit = 20): Promise<NewsImageBackfillRow[]> {
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('news')
      .select('id, external_id, source, image_url')
      .not('image_url', 'is', null)
      .not('image_url', 'ilike', '%supabase.co%')
      .gte('created_at', cutoff)
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
