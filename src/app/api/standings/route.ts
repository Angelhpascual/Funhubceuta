import { NextResponse } from 'next/server'
import { apiError } from '@/lib/apiError'
import { standingsService as service } from '@/lib/services'
import { STANDINGS_CURRENT_SEASON } from '@/lib/constants'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') ?? STANDINGS_CURRENT_SEASON

  try {
    const standings = await service.getStandings(season)
    if (!standings) return NextResponse.json({ error: 'No standings found' }, { status: 404 })
    return NextResponse.json(standings, { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800" } })
  } catch (err) {
    return apiError(err)
  }
}
