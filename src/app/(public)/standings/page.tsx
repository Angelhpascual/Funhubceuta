export const dynamic = 'force-dynamic'

import { StandingsService } from '@/domain/standings/StandingsService'
import { StandingsSupabaseRepository } from '@/infrastructure/supabase/StandingsSupabaseRepository'
import { StandingsTable } from '@/features/standings/components/StandingsTable'

const service = new StandingsService(new StandingsSupabaseRepository())

export default async function StandingsPage() {
  const standings = await service.getStandings('2025-2026')

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Clasificación</h1>
          <p className="text-gray-400 text-sm mt-1">Segunda División — Temporada 2024-2025</p>
        </div>

        {standings ? (
          <>
            <StandingsTable entries={standings.entries} />
            <div className="flex gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Ascenso directo</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Playoff</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Descenso</span>
            </div>
          </>
        ) : (
          <p className="text-gray-400">No hay datos de clasificación disponibles.</p>
        )}
      </div>
    </main>
  )
}
