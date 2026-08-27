'use client'
import Image from 'next/image'
import { MatchFormPreview } from '../MatchFormPreview'
import { LogoPicker } from '../LogoPicker'

type Candidate = { id: string; name: string; number: number; position: string; photo_url?: string }
type SquadPlayer = { id: string; name: string; dorsal: number; position: string; position_group: string; photo_url?: string }
type StandingTeam = { name: string; logo: string | null }

const CEUTA = { name: 'AD Ceuta', logo: '/escudo.webp' }
const posOrder = ['Porteros', 'Defensas', 'Centrocampistas', 'Delanteros']

interface Props {
  squad: SquadPlayer[]
  teams: StandingTeam[]
  busy: boolean
  ceutaHome: boolean
  awayName: string
  awayLogo: string | null
  matchLabel: string
  selectedIds: Set<string>
  showLogoPicker: boolean
  onCeutaHomeToggle: () => void
  onAwayChange: (name: string, logo: string | null) => void
  onMatchLabelChange: (v: string) => void
  onTogglePlayer: (id: string) => void
  onClearSelection: () => void
  onToggleLogoPicker: () => void
  onSelectLogo: (logo: string | null) => void
  onCancel: () => void
  onSubmit: (candidates: Candidate[], matchLabel: string, matchMeta: unknown) => void
}

export function MvpCreateForm({
  squad, teams: allTeams, busy, ceutaHome, awayName, awayLogo, matchLabel, selectedIds,
  showLogoPicker, onCeutaHomeToggle, onAwayChange, onMatchLabelChange,
  onTogglePlayer, onClearSelection, onToggleLogoPicker, onSelectLogo, onCancel, onSubmit,
}: Props) {
  const teams: StandingTeam[] = allTeams.filter(t => t.name !== 'Ceuta')
  const grouped = posOrder
    .map(pos => ({ pos, players: squad.filter(p => p.position_group === pos) }))
    .filter(g => g.players.length > 0)

  function buildCandidates(): Candidate[] {
    return squad.filter(p => selectedIds.has(p.id)).map(p => ({
      id: p.id, name: p.name, number: p.dorsal,
      position: p.position_group.slice(0, 3).toUpperCase(),
      photo_url: p.photo_url,
    }))
  }

  function handleSubmit() {
    const label = matchLabel || (ceutaHome ? `AD Ceuta vs ${awayName}` : `${awayName} vs AD Ceuta`)
    const matchMeta = ceutaHome
      ? { home: CEUTA, away: { name: awayName, logo: awayLogo } }
      : { home: { name: awayName, logo: awayLogo }, away: CEUTA }
    onSubmit(buildCandidates(), label, matchMeta)
  }

  return (
    <div className="rounded-[14px] border border-ceuta-border p-4 space-y-4">
      <div className="text-[13px] font-bold text-ceuta-black">Nueva sesión MVP</div>

      {/* Toggle casa/fuera */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onCeutaHomeToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-ceuta-border bg-ceuta-bg-soft text-[10px] font-bold text-ceuta-black">
          {ceutaHome ? '🏠 Local' : '✈️ Visitante'} <span className="text-ceuta-muted text-[9px]">(cambiar)</span>
        </button>
      </div>

      {/* Preview partido */}
      <MatchFormPreview ceutaHome={ceutaHome} rivalName={awayName} rivalLogo={awayLogo} />

      {/* Selector rival */}
      <select
        className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black"
        value={awayName}
        onChange={(e) => {
          const name = e.target.value
          const found = teams.find(t => t.name === name)
          onAwayChange(name, found?.logo ?? null)
        }}
      >
        <option value="">Selecciona el rival…</option>
        {teams.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
      </select>

      {/* Logo picker */}
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">
          Escudo del rival {awayLogo ? '✓' : '(opcional)'}
        </div>
        <button type="button" className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[11px] text-ceuta-muted bg-ceuta-bg-soft text-left"
          onClick={onToggleLogoPicker}>
          {awayLogo ? 'Cambiar escudo' : 'Elegir escudo →'}
        </button>
        {showLogoPicker && (
          <LogoPicker teams={teams} selectedLogo={awayLogo} onSelect={onSelectLogo} />
        )}
      </div>

      {/* Etiqueta */}
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1">Etiqueta (opcional)</div>
        <input type="text" placeholder="Ej: J1 · 12 Jul" value={matchLabel}
          onChange={(e) => onMatchLabelChange(e.target.value)}
          className="w-full px-3 py-2 rounded-[10px] border border-ceuta-border text-[12px] bg-white text-ceuta-black" />
      </div>

      {/* Selector jugadores */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted">
            Candidatos {selectedIds.size > 0 && <span className="text-ceuta-black">({selectedIds.size} seleccionados)</span>}
          </div>
          {selectedIds.size > 0 && (
            <button type="button" onClick={onClearSelection} className="text-[10px] text-ceuta-red font-bold">Limpiar</button>
          )}
        </div>
        {squad.length === 0 ? (
          <div className="text-[12px] text-ceuta-muted">Cargando plantilla...</div>
        ) : (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {grouped.map(({ pos, players }) => (
              <div key={pos}>
                <div className="text-[9px] font-bold uppercase tracking-widest text-ceuta-muted mb-1.5 px-0.5">{pos}</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {players.map(p => {
                    const sel = selectedIds.has(p.id)
                    return (
                      <button type="button" key={p.id} onClick={() => onTogglePlayer(p.id)}
                        className={`relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-[10px] border-2 transition-all text-center ${
                          sel
                            ? 'bg-ceuta-black border-ceuta-black text-white'
                            : 'bg-ceuta-bg-soft border-ceuta-border text-ceuta-black hover:border-ceuta-black/30'
                        }`}>
                        {sel && (
                          <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-ceuta-red flex items-center justify-center">
                            <span className="text-white text-[7px] font-black leading-none">✓</span>
                          </div>
                        )}
                        {p.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image src={p.photo_url} alt={p.name} width={36} height={36}
                            className={`w-9 h-9 rounded-full object-cover object-top border-2 ${sel ? 'border-white/20' : 'border-ceuta-border'}`} />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-black text-[15px] ${sel ? 'bg-white/10 text-white' : 'bg-ceuta-bg-mid text-ceuta-muted'}`}>
                            {p.dorsal}
                          </div>
                        )}
                        <div className={`font-display text-[10px] font-bold leading-tight line-clamp-2 w-full px-0.5 ${sel ? 'text-white' : 'text-ceuta-black'}`}>
                          {p.name.split(' ')[0]}
                        </div>
                        <div className={`font-display text-[8px] font-bold tracking-wider ${sel ? 'text-white/50' : 'text-ceuta-muted'}`}>
                          #{p.dorsal}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button"
          disabled={busy || !awayName || selectedIds.size < 2}
          onClick={handleSubmit}
          className="flex-1 py-2.5 rounded-[10px] bg-ceuta-black text-white text-[12px] font-bold uppercase disabled:opacity-40"
        >
          Crear ({selectedIds.size} jugadores)
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-[10px] bg-ceuta-bg-mid text-ceuta-black text-[12px] font-bold">
          Cancelar
        </button>
      </div>
    </div>
  )
}
