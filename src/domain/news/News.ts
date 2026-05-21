export interface NewsItem {
  id: string
  title: string
  summary: string | null
  url: string
  source: string
  sourceUrl: string | null
  imageUrl: string | null
  publishedAt: string | null
  createdAt: string
}
