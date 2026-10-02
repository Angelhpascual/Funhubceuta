'use client'

import { LiveSimulator } from '../LiveSimulator'

export const SCENARIOS: { id: string; label: string; push?: Record<string, string> }[] = [
  { id: 'pre',             label: 'Previo' },
  { id: 'live_0_0',        label: 'En vivo 0-0',       push: { event: 'kickoff' } },
  { id: 'live_goal_ceuta', label: 'Gol Ceuta 0-1',     push: { event: 'goal_ceuta', scorer: 'Marcos', score: '0-1', minute: "23'" } },
  { id: 'live_goal_rival', label: 'Gol rival 1-0',     push: { event: 'goal_rival', scorer: 'Rival', score: '1-0' } },
  { id: 'live_events',     label: 'Múltiples eventos' },
  { id: 'win',             label: 'Victoria 0-2',       push: { event: 'win', score: '0-2' } },
  { id: 'draw',            label: 'Empate 1-1',         push: { event: 'draw', score: '1-1' } },
  { id: 'loss',            label: 'Derrota 2-0',        push: { event: 'loss', score: '2-0' } },
]

interface Props {
  mockLoading: string | null
  mockActive: string | null
  onSetMock: (scenario: string) => void
}

export function LiveScenarioSimulator({ mockLoading, mockActive, onSetMock }: Props) {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') return null

  return (
    <div className="mt-5 rounded-[12px] border border-dashed border-ceuta-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-display text-[10px] font-black uppercase tracking-[0.1em] text-amber-700">
          Solo local / preview
        </span>
        <span className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
          Escenario manual
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button type="button"
            key={s.id}
            onClick={() => onSetMock(s.id)}
            disabled={mockLoading !== null}
            className={`rounded-[8px] border px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-all disabled:opacity-40 ${
              mockActive === s.id
                ? 'border-ceuta-black bg-ceuta-black text-white'
                : 'border-ceuta-border bg-white text-ceuta-black hover:border-ceuta-black'
            }`}
          >
            {mockLoading === s.id ? '...' : s.label}
          </button>
        ))}
        <button type="button"
          onClick={() => onSetMock('clear')}
          disabled={mockLoading !== null || mockActive === null}
          className="rounded-[8px] border border-ceuta-red/30 bg-ceuta-red/5 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.08em] text-ceuta-red disabled:opacity-30"
        >
          Limpiar mock
        </button>
      </div>
      {mockActive && (
        <p className="mt-2.5 text-[11px] text-ceuta-muted">
          Mock activo: <strong className="text-ceuta-black">{mockActive}</strong> —{' '}
          <a href="/live" target="_blank" className="text-ceuta-red underline">ver /live</a>
        </p>
      )}

      {/* Simulación automática completa */}
      <LiveSimulator />
    </div>
  )
}
