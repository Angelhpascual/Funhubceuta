import { NextResponse } from 'next/server'
import { MatchesSupabaseRepository } from '@/infrastructure/supabase/MatchesSupabaseRepository'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { apiError } from '@/lib/apiError'

const repo = new MatchesSupabaseRepository()

export async function GET() {
  try {
    const form = await repo.fetchRecentForm()
    if (form.length > 0) {
      return NextResponse.json({ form }, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
      })
    }

    // Fallback: app_config cached form
    const value = await getConfig('ceuta_form')
    if (!value) return NextResponse.json({ form: [] })
    return NextResponse.json({ form: value.split(',').filter(Boolean) }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    return apiError(err)
  }
}
