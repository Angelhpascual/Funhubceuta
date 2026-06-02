import { NextResponse } from 'next/server'
import { NewsSupabaseRepository } from '@/infrastructure/supabase/NewsSupabaseRepository'

const repo = new NewsSupabaseRepository()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  const news = await repo.getLatest(limit, offset)
  return NextResponse.json({ news })
}
