import { LineupPlayer } from '@/domain/match/Lineup'

export const ORDER: Record<string, number> = {
  GK: 0,
  LB: 1,
  CB: 1,
  RB: 1,
  DM: 2,
  CM: 2,
  LM: 2,
  RM: 2,
  CAM: 3,
  LW: 3,
  RW: 3,
  CF: 4,
  SUB: 99,
}

// "4-3-3" → attack-first row counts → [3, 3, 4, 1]
export function parseFormation(formation: string): number[] {
  const parts = formation.split('-').map(Number)
  return [...parts.reverse(), 1]
}

// Left-to-right order within a row
const LATERAL_ORDER: Record<string, number> = {
  LB: 0,
  LW: 0,
  LM: 0,
  DM: 1,
  CM: 1,
  CB: 1,
  CAM: 2,
  RM: 3,
  RW: 3,
  RB: 3,
  CF: 2,
}

export function assignRows(starters: LineupPlayer[], formation: string): LineupPlayer[][] {
  const rowCounts = parseFormation(formation)
  const sorted = [...starters].sort(
    (a, b) => (ORDER[b.positionAbbr] ?? 5) - (ORDER[a.positionAbbr] ?? 5)
  )
  const rows: LineupPlayer[][] = []
  let idx = 0
  for (const count of rowCounts) {
    const row = sorted.slice(idx, idx + count)
    // Sort left to right within each row
    row.sort((a, b) => (LATERAL_ORDER[a.positionAbbr] ?? 2) - (LATERAL_ORDER[b.positionAbbr] ?? 2))
    rows.push(row)
    idx += count
  }
  return rows
}
