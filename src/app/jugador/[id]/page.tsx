import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CURRENT_SEASON } from '@/lib/constants'
import { PlayerDetailPage } from '@/features/club/PlayerDetailPage'
import { fetchPlayerById, fetchPlayerStatsByName } from '@/lib/serverFetches'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const player = await fetchPlayerById(id, CURRENT_SEASON)
  if (!player) return { title: 'Jugador | AD Ceuta FC Info' }
  const position = player.position ? ` · ${player.position}` : ''
  return {
    title: `${player.name}${position} | AD Ceuta FC Info`,
    description: `Ficha y estadísticas de ${player.name} en el AD Ceuta FC. Temporada ${CURRENT_SEASON}.`,
  }
}

export default async function JugadorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await fetchPlayerById(id, CURRENT_SEASON)
  if (!player) notFound()

  const stats = await fetchPlayerStatsByName(player.name, CURRENT_SEASON)

  return <PlayerDetailPage player={player} stats={stats} />
}
