import { notFound } from 'next/navigation'
import { CURRENT_SEASON } from '@/lib/constants'
import { PlayerDetailPage } from '@/features/club/PlayerDetailPage'
import { fetchPlayerById, fetchPlayerStatsByName } from '@/lib/serverFetches'

export const revalidate = 3600

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await fetchPlayerById(id, CURRENT_SEASON)
  if (!player) notFound()

  const stats = await fetchPlayerStatsByName(player.name, CURRENT_SEASON)

  return <PlayerDetailPage player={player} stats={stats} />
}
