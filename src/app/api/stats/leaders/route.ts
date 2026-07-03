import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { getConfig } from '@/infrastructure/supabase/AppConfigRepository'

const HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }

export async function GET() {
  try {
    const value = await getConfig('ceuta_leaders')
    if (!value) return NextResponse.json({ leaders: null }, { headers: HEADERS })
    return NextResponse.json({ leaders: JSON.parse(value) }, { headers: HEADERS })
  } catch (err) {
    return apiError(err)
  }
}
