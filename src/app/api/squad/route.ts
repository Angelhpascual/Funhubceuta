import { NextResponse } from 'next/server'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'

const GROUP_ORDER = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']

export async function GET() {
  const { data } = await supabase
    .from('squad')
    .select('dorsal,name,position,position_group,nationality,photo_url')
    .eq('season', CURRENT_SEASON)
    .order('dorsal', { ascending: true, nullsFirst: false })

  const players = data ?? []

  // Group by position_group in correct order
  const grouped = GROUP_ORDER.map(group => ({
    group,
    players: players.filter(p => p.position_group === group),
  })).filter(g => g.players.length > 0)

  return NextResponse.json({ grouped, total: players.length })
}
