import { LineupPlayer } from '@/app/api/matches/lineup/route'

// Correcciones de posición para jugadores del Ceuta cuya posición ESPN es incorrecta.
// Clave: fragmento del nombre del jugador (case-insensitive). Valor: abreviatura de posición correcta.
const POSITION_OVERRIDES: Record<string, string> = {
  'fernández':  'CF',  // Marcos Fernández — delantero centro
  'koné':       'LW',  // Kialy Koné — extremo izquierdo
  'bassinga':   'RW',  // Bassinga — extremo derecho
  'bodiger':    'CB',  // Bodiger — central
  'capa':       'CB',  // Capa — central
  'aisar':      'LB',  // Aisar — lateral izquierdo
  'anuar':      'RB',  // Anuar — lateral derecho
}

export function applyPositionOverrides(players: LineupPlayer[]): LineupPlayer[] {
  return players.map(p => {
    const key = Object.keys(POSITION_OVERRIDES).find(k =>
      p.name.toLowerCase().includes(k) || p.shortName.toLowerCase().includes(k)
    )
    if (!key) return p
    return { ...p, positionAbbr: POSITION_OVERRIDES[key] }
  })
}

export const ORDER: Record<string, number> = {
  GK: 0, LB: 1, CB: 1, RB: 1, DM: 2, CM: 2, LM: 2, RM: 2,
  CAM: 3, LW: 3, RW: 3, CF: 4, SUB: 99,
}

// "4-3-3" → attack-first row counts → [3, 3, 4, 1]
export function parseFormation(formation: string): number[] {
  const parts = formation.split('-').map(Number)
  return [...parts.reverse(), 1]
}

export function assignRows(starters: LineupPlayer[], formation: string): LineupPlayer[][] {
  const rowCounts = parseFormation(formation)
  const sorted = [...starters].sort((a, b) =>
    (ORDER[b.positionAbbr] ?? 5) - (ORDER[a.positionAbbr] ?? 5)
  )
  const rows: LineupPlayer[][] = []
  let idx = 0
  for (const count of rowCounts) {
    rows.push(sorted.slice(idx, idx + count))
    idx += count
  }
  return rows
}
