import { NextResponse } from 'next/server'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'
import { decodeEntities } from '@/lib/decodeEntities'

const repo = new NewsSupabaseRepository()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  const raw = await repo.getLatest(limit, offset)
  const news = raw.map(n => ({ ...n, title: decodeEntities(n.title) }))
  return NextResponse.json(
    { news },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  )
}
