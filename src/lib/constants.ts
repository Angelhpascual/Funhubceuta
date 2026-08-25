// News source labels — single source of truth used across admin, notifications, and UI
export const SOURCE_LABELS: Record<string, string> = {
  oficial: 'AD Ceuta FC',
  faro: 'El Faro de Ceuta',
  elpueblo: 'El Pueblo de Ceuta',
  ceutadeportiva: 'Ceuta Deportiva',
  marca: 'Marca',
  mundodeportivo: 'Mundo Deportivo',
  '20minutos': '20 Minutos',
  elmundo: 'El Mundo',
  as: 'AS',
  sport: 'Sport',
  confidencial: 'El Confidencial',
  abc: 'ABC',
  lavanguardia: 'La Vanguardia',
  cope: 'COPE',
  ser: 'Cadena SER',
  ceutatv: 'Ceuta Televisión',
  rtvc: 'RTV Ceuta',
  laverdad: 'La Verdad de Ceuta',
  ceutaactualidad: 'Ceuta Actualidad',
  onefootball: 'OneFootball',
  ceutaaldia: 'Ceuta al Día',
  elpais: 'El País',
  rtve: 'RTVE',
  goal: 'Goal.com',
  elgoldigital: 'El Gol Digital',
  fondosegunda: 'Fondo Segunda',
  transfermarkt: 'Transfermarkt',
  teleceuta: 'Teleceuta',
}

// Season & competition
export const CURRENT_SEASON = '2026-2027'
export const PREVIOUS_SEASON = '2025-2026'

// Standings seasons
export const STANDINGS_CURRENT_SEASON = '2026-2027'
export const STANDINGS_PREVIOUS_SEASON = '2025-2026'

// Match seasons — aligned with the current football calendar
export const CURRENT_MATCH_SEASON = '2026-2027'
export const PREVIOUS_MATCH_SEASON = '2025-2026'

export const COMPETITION = 'Liga Hypermotion'

// ESPN API
export const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.2'
export const ESPN_CEUTA_ID = '5404'
export const ESPN_ROSTER = `${ESPN_BASE}/teams/${ESPN_CEUTA_ID}/roster`
export const ESPN_SCOREBOARD = `${ESPN_BASE}/scoreboard`
export const ESPN_SUMMARY = `${ESPN_BASE}/summary`
export const ESPN_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/esp.2/standings'
