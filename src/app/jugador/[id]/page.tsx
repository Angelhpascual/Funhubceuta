import { notFound } from 'next/navigation'
import { supabase } from '@/infrastructure/supabase/client'
import { CURRENT_SEASON } from '@/lib/constants'
import { PlayerDetailPage } from '@/features/club/PlayerDetailPage'

export const revalidate = 3600

async function fetchPlayer(id: string) {
  const { data } = await supabase
    .from('squad')
    .select(
      'id,dorsal,name,position,position_group,nationality,height,weight,birth_date,photo_url,career_history,bio'
    )
    .eq('id', id)
    .eq('season', CURRENT_SEASON)
    .single()
  return data
}

async function fetchPlayerStats(name: string) {
  const { data } = await supabase
    .from('player_stats')
    .select('appearances,goals,assists,shots,shots_on_target,saves,yellow_cards,red_cards')
    .eq('season', CURRENT_SEASON)
    .ilike('name', `%${name.split(' ')[0]}%`)
    .single()
  return data ?? null
}

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await fetchPlayer(id)
  if (!player) notFound()

  const stats = await fetchPlayerStats(player.name)

  return <PlayerDetailPage player={player} stats={stats} />
}
