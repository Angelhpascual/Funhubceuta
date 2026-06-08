export function formatMatchDate(dateStr: string): { day: string; mon: string } {
  const d = new Date(dateStr)
  return {
    day: d.getUTCDate().toString().padStart(2, '0'),
    mon: d.toLocaleString('es-ES', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
  }
}

export function shortTeamName(name: string): string {
  return name
    .replace('AD CEUTA FC', 'AD Ceuta')
    .replace('CEUTA FC', 'AD Ceuta')
    .split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

export function resultLabel(r: string | null): { cls: string; label: string } | null {
  if (!r) return null
  const map: Record<string, { cls: string; label: string }> = {
    W: { cls: 'badge-w', label: 'V' },
    D: { cls: 'badge-d', label: 'E' },
    L: { cls: 'badge-l', label: 'D' },
  }
  return map[r] ?? null
}
