'use client'

import { useEffect, useRef, useState } from 'react'

// 10 steps over 5 minutes (30s each)
const SIM_STEPS: {
  scenario: string
  label: string
  push?: { event: string; scorer?: string; score?: string; minute?: string }
  note: string
}[] = [
  { scenario: 'sim_pre',       label: 'Previo · Alineaciones',      note: 'El partido aún no ha comenzado. Alineaciones publicadas.' },
  { scenario: 'sim_kickoff',   label: 'Pitido inicial',              push: { event: 'kickoff', rival: 'FC Andorra' } as never, note: 'Partido en marcha. Push: ¡Arranca el partido!' },
  { scenario: 'sim_amarilla',  label: "15' · Tarjeta amarilla",     note: 'Amarilla a García (rival). Sin push.' },
  { scenario: 'sim_goal1',     label: "23' · ¡GOL CEUTA! 0-1",     push: { event: 'goal_ceuta', scorer: 'Zalazar', score: '0-1', minute: "23'" }, note: 'Zalazar marca. Push: ¡GOOOOL!' },
  { scenario: 'sim_mid1',      label: "38' · Stats actualizadas",   note: 'Estadísticas evolucionan. Sin push.' },
  { scenario: 'sim_halftime',  label: "45+2' · Descanso 0-1",      note: 'Descanso. Sin push.' },
  { scenario: 'sim_2half',     label: "50' · 2ª parte",             note: 'Segunda parte en marcha.' },
  { scenario: 'sim_goal_rival',label: "58' · Gol rival 1-1",        push: { event: 'goal_rival', scorer: 'Molina', score: '1-1' } as never, note: 'Molina empata. Push: Gol en contra.' },
  { scenario: 'sim_roja',      label: "65' · Roja rival",           push: { event: 'red_rival', scorer: 'Torres', minute: "65'" } as never, note: 'Torres expulsado. Push: Tarjeta roja rival.' },
  { scenario: 'sim_goal2',     label: "74' · ¡GOL CEUTA! 1-2",     push: { event: 'goal_ceuta', scorer: 'Hassan', score: '1-2', minute: "74'" }, note: 'Hassan adelanta al Ceuta. Push: ¡GOOOOL!' },
  { scenario: 'sim_final',     label: "90' · FINAL 1-2 ¡Victoria!", push: { event: 'win', score: '1-2' } as never, note: '¡Victoria! Push: ¡Ganamos!' },
]

const STEP_DURATION = 30_000 // 30s per step

export function LiveSimulator() {
  const [running, setRunning] = useState(false)
  const [step, setStep]       = useState(-1) // -1 = idle
  const [log, setLog]         = useState<string[]>([])
  const timerRef              = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepRef               = useRef(-1)

  function addLog(msg: string) {
    setLog(prev => [`${new Date().toLocaleTimeString('es')} — ${msg}`, ...prev].slice(0, 20))
  }

  async function runStep(i: number) {
    if (i >= SIM_STEPS.length) {
      setRunning(false)
      setStep(-1)
      addLog('Simulación completada ✓')
      return
    }
    const s = SIM_STEPS[i]
    stepRef.current = i
    setStep(i)
    addLog(`[${i + 1}/${SIM_STEPS.length}] ${s.label}`)

    // 1. Update mock
    await fetch('/api/admin/live-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: s.scenario }),
    })

    // 2. Push notification (if defined)
    if (s.push) {
      const r = await fetch('/api/admin/live-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rival: 'FC Andorra', ...s.push }),
      })
      const d = await r.json()
      if (d.warn) addLog(`  ↳ ⚠ ${d.warn}`)
      else addLog(`  ↳ Push enviado a ${d.sent ?? 0} dispositivo(s)`)
    }

    addLog(`  ↳ ${s.note}`)

    // Schedule next step
    timerRef.current = setTimeout(() => runStep(i + 1), STEP_DURATION)
  }

  function start() {
    if (running) return
    setRunning(true)
    setLog([])
    addLog('Iniciando simulación completa (5 min)…')
    runStep(0)
  }

  function stop() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setRunning(false)
    setStep(-1)
    addLog('Simulación detenida manualmente')
    // Clear mock
    fetch('/api/admin/live-mock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'clear' }),
    })
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const progress = running && step >= 0 ? Math.round(((step + 1) / SIM_STEPS.length) * 100) : 0

  return (
    <div className="mt-5 rounded-[12px] border-[1.5px] border-dashed border-[var(--border)] p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-[14px]">
        <span className="bg-[#FEF3C7] text-[#92400E] font-display text-[10px] font-extrabold uppercase tracking-[0.1em] px-[7px] py-[3px] rounded">
          Solo preview
        </span>
        <span className="font-display text-[12px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
          Simulación completa · 5 min
        </span>
      </div>

      {/* Description */}
      <p className="text-[12px] text-[var(--muted)] mb-[14px] leading-[1.5]">
        Simula un partido completo en 5 minutos ({SIM_STEPS.length} pasos de 30s). Actualiza el mock, estadísticas y envía push notifications reales a los dispositivos admin.
      </p>

      {/* Progress */}
      {running && (
        <div className="mb-[14px]">
          <div className="flex justify-between mb-1">
            <span className="font-display text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--red)]">
              {SIM_STEPS[step]?.label ?? '…'}
            </span>
            <span className="font-display text-[11px] font-bold text-[var(--muted)]">
              {step + 1}/{SIM_STEPS.length}
            </span>
          </div>
          <div className="h-1 bg-[var(--border)] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-[var(--red)] rounded-[2px] transition-[width] duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-[var(--muted)]">
            Siguiente paso en ~30s · <a href="/live" target="_blank" className="text-[var(--red)] underline">Ver /live</a>
          </p>
        </div>
      )}

      {/* Steps list */}
      <div className="flex flex-col gap-1 mb-[14px]">
        {SIM_STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className={`w-[18px] h-[18px] rounded-full shrink-0 flex items-center justify-center transition-[background] duration-300 ${
                step > i ? 'bg-[var(--black)]' : step === i ? 'bg-[var(--red)]' : 'bg-[var(--border)]'
              }`}
            >
              {step > i
                ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="w-[10px] h-[10px]"><polyline points="20 6 9 17 4 12" /></svg>
                : <span className={`font-display text-[9px] font-extrabold ${step === i ? 'text-white' : 'text-[var(--muted)]'}`}>{i + 1}</span>
              }
            </span>
            <span className={`text-[12px] ${step === i ? 'text-[var(--black)] font-bold' : 'text-[var(--muted)] font-normal'}`}>
              {s.label}
              {s.push && <span className="ml-1 text-[10px] text-[var(--red)]">🔔</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button type="button"
          onClick={start}
          disabled={running}
          className={`flex-1 py-[10px] rounded-[10px] border-none font-display text-[12px] font-extrabold uppercase tracking-[0.08em] text-white transition-opacity ${
            running ? 'bg-[var(--border)] opacity-50 cursor-not-allowed' : 'bg-[var(--black)] cursor-pointer'
          }`}
        >
          {running ? 'En curso…' : '▶ Iniciar simulación'}
        </button>
        {running && (
          <button type="button"
            onClick={stop}
            className="px-4 py-[10px] rounded-[10px] border-none cursor-pointer bg-[var(--red)] text-white font-display text-[12px] font-extrabold uppercase tracking-[0.08em]"
          >
            Detener
          </button>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div className="mt-3 bg-[var(--black)] rounded-lg px-3 py-[10px] max-h-[140px] overflow-y-auto">
          {log.map((l, i) => (
            <div key={i} className={`font-mono text-[11px] leading-[1.6] ${i === 0 ? 'text-white' : 'text-white/45'}`}>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
