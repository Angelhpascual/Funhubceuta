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
    <div style={{ marginTop: 20, borderRadius: 12, border: '1.5px dashed var(--border)', padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ background: '#FEF3C7', color: '#92400E', fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 7px', borderRadius: 4 }}>
          Solo preview
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
          Simulación completa · 5 min
        </span>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Simula un partido completo en 5 minutos ({SIM_STEPS.length} pasos de 30s). Actualiza el mock, estadísticas y envía push notifications reales a los dispositivos admin.
      </p>

      {/* Progress */}
      {running && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--red)' }}>
              {SIM_STEPS[step]?.label ?? '…'}
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
              {step + 1}/{SIM_STEPS.length}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'var(--red)', borderRadius: 2, transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ marginTop: 4, fontSize: 11, color: 'var(--muted)' }}>
            Siguiente paso en ~30s · <a href="/live" target="_blank" style={{ color: 'var(--red)', textDecoration: 'underline' }}>Ver /live</a>
          </p>
        </div>
      )}

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {SIM_STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: step > i ? 'var(--black)' : step === i ? 'var(--red)' : 'var(--border)',
              transition: 'background 0.3s',
            }}>
              {step > i
                ? <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" style={{ width: 10, height: 10 }}><polyline points="20 6 9 17 4 12" /></svg>
                : <span style={{ fontFamily: 'var(--font-display)', fontSize: 9, fontWeight: 800, color: step === i ? '#fff' : 'var(--muted)' }}>{i + 1}</span>
              }
            </span>
            <span style={{ fontSize: 12, color: step > i ? 'var(--muted)' : step === i ? 'var(--black)' : 'var(--muted)', fontWeight: step === i ? 700 : 400 }}>
              {s.label}
              {s.push && <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--red)' }}>🔔</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={start}
          disabled={running}
          style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
            background: running ? 'var(--border)' : 'var(--black)', color: '#fff',
            fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            opacity: running ? 0.5 : 1,
          }}
        >
          {running ? 'En curso…' : '▶ Iniciar simulación'}
        </button>
        {running && (
          <button
            onClick={stop}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--red)', color: '#fff',
              fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            Detener
          </button>
        )}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ marginTop: 12, background: 'var(--black)', borderRadius: 8, padding: '10px 12px', maxHeight: 140, overflowY: 'auto' }}>
          {log.map((l, i) => (
            <div key={i} style={{ fontFamily: 'monospace', fontSize: 11, color: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
              {l}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
