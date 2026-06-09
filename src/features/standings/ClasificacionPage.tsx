"use client";

import { StandingEntry } from "@/domain/standings/Standings";
import { findLogo as findLogoUtil } from "@/lib/findLogo";

function getZone(pos: number, total: number): 'promo' | 'playoff' | 'relegation' | 'none' {
  if (pos <= 2) return "promo";
  if (pos <= 6) return "playoff";
  if (pos >= total - 3) return "relegation";
  return "none";
}

function getZoneLabel(pos: number, total: number): string {
  if (pos <= 2) return "Ascenso directo";
  if (pos <= 6) return "Zona play-off";
  if (pos >= total - 3) return "Zona descenso";
  return "Zona media";
}

function isCeuta(entry: StandingEntry): boolean {
  return entry.teamName.toLowerCase().includes("ceuta");
}

const FORM_LABEL: Record<string, string> = { W: 'V', D: 'E', L: 'D' }

function FormPill({ result }: { result: string }) {
  const bg = result === 'W' ? 'bg-green-600' : result === 'D' ? 'bg-ceuta-muted' : 'bg-ceuta-black'
  return (
    <div className={`flex size-[22px] items-center justify-center rounded-[4px] font-display text-[10px] font-black text-white ${bg}`}>
      {FORM_LABEL[result] ?? result}
    </div>
  )
}

const ZONE_BAR: Record<string, string> = {
  promo: 'bg-ceuta-gold',
  playoff: 'bg-ceuta-red',
  relegation: 'bg-ceuta-black',
  none: 'bg-transparent',
}

const ZONE_POS: Record<string, string> = {
  promo: 'text-ceuta-black',
  playoff: 'text-ceuta-black',
  relegation: 'text-ceuta-muted',
  none: 'text-ceuta-muted',
}

function SkeletonRow({ i }: { i: number }) {
  return (
    <div
      className="grid items-center gap-1 border-b border-ceuta-border px-[14px] py-[11px]"
      style={{ gridTemplateColumns: '32px 1fr repeat(4, 28px) 34px', opacity: 1 - i * 0.03 }}
    >
      <div className="mx-auto h-[14px] w-4 animate-pulse rounded-[3px] bg-ceuta-bg-mid" />
      <div className="flex items-center gap-2">
        <div className="size-[22px] shrink-0 animate-pulse rounded-full bg-ceuta-bg-mid" />
        <div className="h-[13px] animate-pulse rounded-[3px] bg-ceuta-bg-mid" style={{ width: 90 + (i % 3) * 20 }} />
      </div>
      {[1,2,3,4,5].map(j => (
        <div key={j} className="mx-auto h-[13px] w-5 animate-pulse rounded-[3px] bg-ceuta-bg-mid" />
      ))}
    </div>
  )
}

interface Props {
  entries?: StandingEntry[]
  form?: string[]
  logos?: Record<string, string>
}

export function ClasificacionPage({ entries = [], form = [], logos = {} }: Props) {
  const me = entries.find(isCeuta);
  const total = entries.length;

  function findLogo(name: string): string | null {
    return findLogoUtil(logos, name);
  }

  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        {/* diagonal stripes */}
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
          <div className="h-0.5 w-[18px] bg-ceuta-red" />
          Temporada 2025–26 · Jornada {me?.played ?? "—"}
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          CLASIFI<em className="not-italic text-ceuta-gold">CACIÓN</em>
          <br />
          LIGA HYPERMOTION
        </div>
      </div>

      {/* ── CARD CEUTA ── */}
      {me && (
        <div className="relative z-[2] -mt-7 mx-3 rounded-[14px] border-2 border-ceuta-black bg-white p-[18px] shadow-[6px_6px_0_#D62027]">
          <div className="flex items-center gap-3">
            {/* position */}
            <div className="font-display text-[56px] font-black leading-[0.85] tracking-[-0.02em] text-ceuta-black">
              {me.position}
              <sup className="text-[18px] text-ceuta-red ml-0.5 align-super">º</sup>
            </div>
            {/* meta */}
            <div className="flex-1">
              <div className="font-display text-[18px] font-black uppercase tracking-[0.02em] text-ceuta-black">
                AD Ceuta FC
              </div>
              <div className="mt-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-ceuta-muted">
                {getZoneLabel(me.position, total)}
              </div>
            </div>
            {/* points */}
            <div className="text-right">
              <div className="font-display text-[32px] font-black leading-[0.9] text-ceuta-red">{me.points}</div>
              <div className="mt-0.5 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">Puntos</div>
            </div>
          </div>

          {/* stats */}
          <div className="mt-[14px] grid grid-cols-5 gap-1 border-t border-dashed border-ceuta-border pt-[14px]">
            {[
              { v: me.played,      l: 'PJ' },
              { v: me.won,         l: 'PG' },
              { v: me.drawn,       l: 'PE' },
              { v: me.lost,        l: 'PP' },
              { v: me.goalDifference > 0 ? `+${me.goalDifference}` : me.goalDifference, l: 'DG' },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center gap-0.5">
                <div className="font-display text-[16px] font-black text-ceuta-black">{v}</div>
                <div className="font-display text-[9.5px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">{l}</div>
              </div>
            ))}
          </div>

          {/* form */}
          {form.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
                Últimos 5
              </span>
              {form.slice(-5).map((f, i) => <FormPill key={i} result={f} />)}
            </div>
          )}
        </div>
      )}

      {/* ── SECTION HEADER ── */}
      <div className="px-3 pb-1 pt-5">
        <div className="font-display text-[18px] font-black uppercase tracking-[0.04em] text-ceuta-black">
          Tabla completa
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="mt-2 bg-white">
        {/* head */}
        <div
          className="grid items-center gap-1 border-b-2 border-ceuta-black px-[14px] pb-2"
          style={{ gridTemplateColumns: '32px 1fr repeat(4, 28px) 34px' }}
        >
          {['#', 'Equipo', 'PJ', 'DG', 'GF', 'GC', 'PTS'].map((h, i) => (
            <div
              key={h}
              className={`font-display text-[10px] font-bold uppercase tracking-[0.1em] ${i === 0 || i > 1 ? 'text-center' : 'text-left'} ${h === 'PTS' ? 'text-ceuta-black' : 'text-ceuta-muted'}`}
            >
              {h}
            </div>
          ))}
        </div>

        {entries.map((t) => {
              const zone = getZone(t.position, total)
              const mine = isCeuta(t)
              const logo = findLogo(t.teamName)
              return (
                <div
                  key={t.id ?? t.externalId}
                  className={`relative grid items-center gap-1 border-b border-ceuta-border px-[14px] py-[11px] active:bg-ceuta-bg-soft ${mine ? 'bg-gradient-to-r from-ceuta-red-soft to-transparent' : ''}`}
                  style={{ gridTemplateColumns: '32px 1fr repeat(4, 28px) 34px' }}
                >
                  {/* zone bar */}
                  {zone !== 'none' && (
                    <div className={`absolute left-0 top-1/2 h-[22px] w-[3px] -translate-y-1/2 rounded-r-sm ${mine ? 'w-[4px] bg-ceuta-red' : ZONE_BAR[zone]}`} />
                  )}

                  {/* position */}
                  <div className={`text-center font-display text-[16px] font-black ${mine ? 'text-ceuta-red' : ZONE_POS[zone]}`}>
                    {t.position}
                  </div>

                  {/* name */}
                  <div className="flex min-w-0 items-center gap-2">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo} alt={t.teamName} className="size-[22px] shrink-0 object-contain" />
                    ) : (
                      <div className={`flex size-6 shrink-0 items-center justify-center rounded-full font-display text-[8px] font-black ${mine ? 'bg-ceuta-red text-white' : 'bg-ceuta-bg-soft text-ceuta-muted'}`}>
                        {t.teamName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                    <div className={`truncate font-display text-[14px] font-bold uppercase tracking-[0.02em] ${mine ? 'text-ceuta-red-dark' : 'text-ceuta-black'}`}>
                      {t.teamName}
                    </div>
                  </div>

                  {/* stats */}
                  <div className="text-center font-display text-[13px] font-semibold text-ceuta-black">{t.played}</div>
                  <div className="text-center font-display text-[13px] font-semibold text-ceuta-black">
                    {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
                  </div>
                  <div className="text-center font-display text-[13px] font-semibold text-ceuta-black">{t.goalsFor}</div>
                  <div className="text-center font-display text-[13px] font-semibold text-ceuta-black">{t.goalsAgainst}</div>
                  <div className={`text-center font-display text-[16px] font-black ${mine ? 'text-ceuta-red' : 'text-ceuta-black'}`}>
                    {t.points}
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* ── LEGEND ── */}
      <div className="mt-4 bg-ceuta-bg-soft p-4">
        <div className="mb-2.5 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
          Zonas de la tabla
        </div>
        {[
          { bar: 'bg-ceuta-gold', text: 'Ascenso directo · 1.º–2.º' },
          { bar: 'bg-ceuta-red',  text: 'Play-off ascenso · 3.º–6.º' },
          { bar: 'bg-ceuta-black', text: 'Descenso · 19.º–22.º' },
        ].map(({ bar, text }) => (
          <div key={text} className="flex items-center gap-2.5 py-1">
            <div className={`h-4 w-1 shrink-0 rounded-sm ${bar}`} />
            <div className="font-display text-[12px] font-semibold text-ceuta-black">{text}</div>
          </div>
        ))}
      </div>

      <div className="h-4" />
    </div>
  );
}
