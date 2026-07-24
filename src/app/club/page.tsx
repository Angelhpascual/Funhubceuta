import { Suspense } from 'react'
import { ClubPage } from '@/features/club/ClubPage'
import { standingsService } from '@/lib/services'
import { CURRENT_SEASON, PREVIOUS_SEASON, STANDINGS_CURRENT_SEASON, STANDINGS_PREVIOUS_SEASON } from '@/lib/constants'
import { fetchCeutaForm, fetchSquadBySeason, fetchLeadersBySeason } from '@/lib/serverFetches'

export const revalidate = 300

async function fetchCeuta(season: string) {
  const standings = await standingsService.getStandings(season)
  return standings?.entries?.find((e) => e.teamName.toLowerCase().includes('ceuta')) ?? null
}

export default async function ClubServerPage() {
  const [
    { grouped, total },
    { grouped: previousGrouped, total: previousTotal },
    ceuta,
    ceutaPrevious,
    form,
    leaders,
    previousLeaders,
  ] = await Promise.all([
    fetchSquadBySeason(CURRENT_SEASON),
    fetchSquadBySeason(PREVIOUS_SEASON),
    fetchCeuta(STANDINGS_CURRENT_SEASON),
    fetchCeuta(STANDINGS_PREVIOUS_SEASON),
    fetchCeutaForm(),
    fetchLeadersBySeason(CURRENT_SEASON),
    fetchLeadersBySeason(PREVIOUS_SEASON),
  ])

  return (
    <Suspense>
      <ClubPage
        grouped={grouped}
        total={total}
        previousGrouped={previousGrouped}
        previousTotal={previousTotal}
        ceuta={ceuta}
        ceutaPrevious={ceutaPrevious}
        form={form}
        leaders={leaders}
        previousLeaders={previousLeaders}
      />
    </Suspense>
  )
}
