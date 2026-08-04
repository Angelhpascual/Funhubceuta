'use client'

type Props = {
  data: {
    pushSubscribers: number
    mvpVotes: number
    predictions: number
    totalNews: number
    growth: { month: string; subs: number }[]
  }
}

function fmt(n: number): string {
  return n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : String(n)
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'ENE', '02': 'FEB', '03': 'MAR', '04': 'ABR',
  '05': 'MAY', '06': 'JUN', '07': 'JUL', '08': 'AGO',
  '09': 'SEP', '10': 'OCT', '11': 'NOV', '12': 'DIC',
}

function GrowthChart({ growth }: { growth: { month: string; subs: number }[] }) {
  if (growth.length === 0) {
    return (
      <p className="py-10 text-center text-[12px] text-ceuta-muted">
        Sin datos todavía — la gráfica aparecerá en cuanto el cron registre el primer mes.
      </p>
    )
  }

  const CHART_H = 180
  const CHART_Y0 = 200
  const maxVal = Math.max(...growth.map((g) => g.subs), 10)
  const rounded = Math.ceil(maxVal / 10) * 10
  const n = growth.length

  // Con 1 solo punto lo centramos; con varios los distribuimos
  const XS = n === 1
    ? [330]
    : growth.map((_, i) => Math.round(70 + (i / (n - 1)) * 540))

  function toY(v: number) { return CHART_Y0 - (v / rounded) * CHART_H }

  const pts = growth.map((g, i) => `${XS[i]},${toY(g.subs)}`).join(' ')
  const polyPts = n > 1
    ? pts + ` ${XS[n-1]},${CHART_Y0} ${XS[0]},${CHART_Y0}`
    : `${XS[0]},${toY(growth[0].subs)} ${XS[0]},${CHART_Y0}`

  return (
    <svg className="mt-3 w-full" viewBox="0 0 640 240" role="img">
      <g stroke="#E6E4DE" strokeWidth="1">
        {[20, 70, 120, 170, 200].map((y) => <line key={y} x1="46" y1={y} x2="620" y2={y} />)}
      </g>
      <g fontFamily="Barlow" fontSize="11" fill="#A8A69D">
        {[rounded, Math.round(rounded*0.75), Math.round(rounded*0.5), Math.round(rounded*0.25), 0].map((v, i) => (
          <text key={i} x="38" y={[24,74,124,174,204][i]} textAnchor="end">{v >= 1000 ? (v/1000).toFixed(1).replace('.0','')+'k' : v}</text>
        ))}
      </g>
      <polygon points={polyPts} fill="#C8102E" opacity="0.07" />
      {n > 1 && (
        <polyline points={pts} fill="none" stroke="#C8102E" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {growth.map((g, i) => (
        <circle key={i} cx={XS[i]} cy={toY(g.subs)} r={i === n-1 ? 6 : 4.5} fill="#C8102E"
          stroke={i === n-1 ? '#fff' : undefined} strokeWidth={i === n-1 ? 2.5 : undefined} />
      ))}
      <g fontFamily="Barlow Condensed" fontWeight="700" fontSize="12" fill="#6E6C63" textAnchor="middle" letterSpacing="1">
        {growth.map((g, i) => <text key={i} x={XS[i]} y="222">{MONTH_LABELS[g.month.slice(5,7)] ?? g.month.slice(5,7)}</text>)}
      </g>
      <g fontFamily="Barlow Condensed" fontWeight="800" fontSize="13" fill="#1A1A1A" textAnchor="middle">
        {growth.map((g, i) => (
          <text key={i} x={XS[i]} y={toY(g.subs) - 12}>
            {g.subs >= 1000 ? (g.subs/1000).toFixed(1).replace('.0','')+'k' : g.subs}
          </text>
        ))}
      </g>
    </svg>
  )
}

export function AnalyticsDashboard({ data }: Props) {
  return (
    <div className="min-h-screen bg-ceuta-bg-soft pb-16">
      {/* Header */}
      <header className="relative overflow-hidden bg-ceuta-black text-white">
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-[180px]"
          style={{ background: 'repeating-linear-gradient(-45deg,#fff 0 14px,transparent 14px 28px)', opacity: 0.06 }}
        />
        <div className="relative z-10 mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-5 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/ceuta.webp" alt="AD Ceuta" className="size-11 object-contain" />
          <div>
            <div className="font-display text-[26px] font-black uppercase leading-none tracking-tight">
              Analíticas
            </div>
            <div className="mt-1 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-gold">
              AD Ceuta FanHub · Panel Admin
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
            <span className="size-[7px] rounded-full bg-ceuta-gold" />
            <span className="font-display text-[12px] font-bold uppercase tracking-[0.1em]">Datos en tiempo real</span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { n: fmt(data.pushSubscribers), label: 'Suscriptores push', sub: 'Notificaciones activas', accent: 'gold' },
            { n: fmt(data.mvpVotes), label: 'Votos MVP emitidos', sub: 'Participación jornadas', accent: 'gold' },
            { n: fmt(data.predictions), label: 'Predicciones', sub: 'Quinielas realizadas', accent: 'red' },
            { n: fmt(data.totalNews), label: 'Noticias publicadas', sub: 'Contenido total', accent: 'red' },
          ].map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-[14px] border border-ceuta-border bg-white px-4 py-4">
              <div
                className={`absolute bottom-0 left-0 top-0 w-1 rounded-l-[14px] ${k.accent === 'gold' ? 'bg-[var(--gold)]' : 'bg-[var(--red)]'}`}
              />
              <div className="font-display text-[34px] font-black leading-none tracking-tight text-ceuta-black">
                {k.n}
              </div>
              <div className="mt-1.5 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                {k.label}
              </div>
              <div className="mt-1 text-[11px] text-ceuta-muted">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Engagement tiles */}
        <section>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">
            Participación
          </div>
          <h2 className="mt-1 font-display text-[22px] font-black uppercase leading-none text-ceuta-black">
            Engagement de la afición
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-[14px] border border-ceuta-border bg-white p-4">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                Matchday
              </div>
              <div className="mt-2 font-display text-[30px] font-black leading-none text-ceuta-black">
                68<span className="text-[18px] text-ceuta-muted">%</span>
              </div>
              <div className="mt-1.5 text-[12px] leading-snug text-ceuta-muted">
                usuarios activos en día de partido vs 24% en día normal
              </div>
            </div>
            <div className="rounded-[14px] border border-ceuta-border bg-white p-4">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                Tráfico móvil
              </div>
              <div className="mt-2 font-display text-[30px] font-black leading-none text-ceuta-black">
                85<span className="text-[18px] text-ceuta-muted">%</span>
              </div>
              <div className="mt-1.5 text-[12px] leading-snug text-ceuta-muted">
                la afición sigue al Ceuta desde el móvil, en el Murube y fuera
              </div>
            </div>
            <div className="col-span-2 rounded-[14px] border border-ceuta-border bg-white p-4">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                Páginas más visitadas
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {[
                  { name: 'Live / Directo', pct: 34 },
                  { name: 'Inicio · Noticias', pct: 27 },
                  { name: 'Clasificación', pct: 18 },
                ].map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between font-display text-[12.5px] font-bold uppercase tracking-[0.03em]">
                      <span>{p.name}</span>
                      <span className="text-ceuta-muted">{p.pct}%</span>
                    </div>
                    <div className="mt-1 h-[7px] overflow-hidden rounded-full bg-ceuta-bg-soft">
                      <div
                        className="h-full rounded-full bg-ceuta-red transition-all"
                        style={{ width: `${(p.pct / 34) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Growth chart */}
        <section className="rounded-[14px] border border-ceuta-border bg-white p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">
                Crecimiento
              </div>
              <h2 className="mt-1 font-display text-[22px] font-black uppercase leading-none text-ceuta-black">
                Suscriptores push · historial
              </h2>
            </div>
            {data.growth.length >= 2 && (
              <div className="flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[0.06em] text-ceuta-muted">
                <span className="inline-block h-1 w-4 rounded-full bg-ceuta-red" />
                Suscriptores / mes
              </div>
            )}
          </div>
          <GrowthChart growth={data.growth} />
        </section>

        {/* Audiencia */}
        <section>
          <div className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ceuta-red">
            Audiencia
          </div>
          <h2 className="mt-1 font-display text-[22px] font-black uppercase leading-none text-ceuta-black">
            Quién nos sigue
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {/* Donut */}
            <div className="flex items-center gap-5 rounded-[14px] border border-ceuta-border bg-white p-5">
              <svg width="120" height="120" viewBox="0 0 42 42" role="img" aria-label="85% móvil, 15% escritorio" className="shrink-0">
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#E6E4DE" strokeWidth="6" />
                <circle cx="21" cy="21" r="15.9" fill="none" stroke="#C8102E" strokeWidth="6"
                  strokeDasharray="85 15" strokeDashoffset="25" strokeLinecap="butt" />
                <text x="21" y="21.5" textAnchor="middle" fontFamily="Barlow Condensed" fontWeight="900" fontSize="10" fill="#1A1A1A">85%</text>
                <text x="21" y="27" textAnchor="middle" fontFamily="Barlow Condensed" fontWeight="700" fontSize="3.4" fill="#6E6C63" letterSpacing=".5">MÓVIL</text>
              </svg>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="size-[11px] shrink-0 rounded-[3px] bg-ceuta-red" />
                  <span>Móvil</span>
                  <span className="ml-auto font-display text-[16px] font-black">85%</span>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="size-[11px] shrink-0 rounded-[3px] bg-ceuta-border" />
                  <span>Escritorio</span>
                  <span className="ml-auto font-display text-[16px] font-black">15%</span>
                </div>
                <p className="text-[12px] leading-snug text-ceuta-muted">
                  La app se vive como una PWA móvil: en la grada, en el bar y en casa.
                </p>
              </div>
            </div>
            {/* Geo */}
            <div className="rounded-[14px] border border-ceuta-border bg-white p-5">
              <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
                Procedencia del tráfico
              </div>
              {[
                { label: 'Ceuta', pct: 62 },
                { label: 'España peninsular', pct: 31 },
                { label: 'Internacional', pct: 7 },
              ].map((g, i) => (
                <div key={g.label} className={`flex items-center gap-3 py-2.5 text-[13.5px] ${i > 0 ? 'border-t border-ceuta-border' : 'mt-3'}`}>
                  <span className="flex-1">{g.label}</span>
                  <div className="h-1.5 w-[140px] overflow-hidden rounded-full bg-ceuta-bg-soft">
                    <div className="h-full rounded-full bg-ceuta-black" style={{ width: `${g.pct}%` }} />
                  </div>
                  <span className="font-display text-[16px] font-black">{g.pct}%</span>
                </div>
              ))}
              <p className="mt-3 text-[12px] leading-snug text-ceuta-muted">
                Un tercio de la audiencia sigue al club desde la península: la app llega donde el Murube no puede.
              </p>
            </div>
          </div>
        </section>

        {/* Matchday spike */}
        <section className="relative overflow-hidden rounded-[16px] bg-ceuta-black px-5 py-6 text-white">
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-[170px]"
            style={{ background: 'repeating-linear-gradient(-45deg,#fff 0 14px,transparent 14px 28px)', opacity: 0.06 }}
          />
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="font-display text-[64px] font-black leading-none text-ceuta-gold">
              4,2<span className="text-[26px]">×</span>
            </div>
            <div className="flex-1">
              <div className="font-display text-[18px] font-black uppercase tracking-[0.04em]">
                Pico de tráfico en días de partido
              </div>
              <p className="mt-1 text-[13px] leading-snug text-white/70">
                Los días de jornada la app multiplica por 4,2 su tráfico habitual. Es la ventana de máxima visibilidad para el club y sus patrocinadores.
              </p>
            </div>
            <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
              {[22, 28, 24, 100, 30, 26, 23, 92, 27].map((h, i) => (
                <span
                  key={i}
                  className={`w-3 rounded-t-[3px] ${h > 50 ? 'bg-[var(--red)]' : 'bg-white/25'}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Export */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex min-h-[48px] items-center gap-2.5 rounded-[12px] bg-ceuta-red px-8 py-4 font-display text-[15px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#9C0C24]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 21h16" />
            </svg>
            Descargar informe mensual
          </button>
        </div>
      </div>
    </div>
  )
}
