import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

const TEAMS: Array<{ id: string; name: string }> = [
  { id: '2737', name: 'Albacete' },
  { id: '6832', name: 'Almería' },
  { id: '12597', name: 'Burgos' },
  { id: '11487', name: 'CD Sabadell' },
  { id: '4438', name: 'Castellón' },
  { id: '5404', name: 'Ceuta' },
  { id: '3842', name: 'Cádiz' },
  { id: '8447', name: 'Córdoba' },
  { id: '3752', name: 'Eibar' },
  { id: '7320', name: 'Eldense' },
  { id: '20179', name: 'FC Andorra' },
  { id: '9812', name: 'Girona' },
  { id: '3747', name: 'Granada' },
  { id: '98', name: 'Las Palmas' },
  { id: '17534', name: 'Leganés' },
  { id: '84', name: 'Mallorca' },
  { id: '131858', name: 'RC Celta Fortuna' },
  { id: '92', name: 'Real Oviedo' },
  { id: '20983', name: 'Real Sociedad II' },
  { id: '95', name: 'Real Valladolid' },
  { id: '3788', name: 'Sporting Gijón' },
  { id: '245', name: 'Tenerife' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== process.env.TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = TEAMS.map(({ id, name }) => ({
    name,
    logo_url: `https://a.espncdn.com/i/teamlogos/soccer/500/${id}.png`,
    season: CURRENT_SEASON,
  }))

  const { error } = await supabase
    .from('teams')
    .upsert(rows, { onConflict: 'name,season', ignoreDuplicates: false })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, total: rows.length })
}
