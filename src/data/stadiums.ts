import { stripAccents } from '@/lib/stripAccents'

// Estadios de los equipos de La Liga Hypermotion 26/27 + AD Ceuta
// Fuente: datos oficiales. No cambian salvo ascensos/descensos de temporada.

const STADIUMS: Record<string, string> = {
  // AD Ceuta
  'ad ceuta':          'Alfonso Murube',
  'ad ceuta fc':       'Alfonso Murube',
  'ceuta':             'Alfonso Murube',

  // Rivales Liga Hypermotion 26/27
  'albacete':          'Estadio Carlos Belmonte',
  'almería':           'Power Horse Stadium',
  'burgos':            'Estadio El Plantío',
  'cádiz':             'Nuevo Mirandilla',
  'castellón':         'Estadio Castalia',
  'rc celta fortuna':  'Municipal de Barreiro',
  'córdoba':           'Estadio El Arcángel',
  'eibar':             'Estadio Municipal de Ipurua',
  'eldense':           'Estadio Nuevo Pepico Amat',
  'fc andorra':        'Estadio de la FAF (Encamp)',
  'girona':            'Estadi Montilivi',
  'granada':           'Estadio Nuevo Los Cármenes',
  'las palmas':        'Estadio Gran Canaria',
  'leganés':           'Estadio Municipal de Butarque',
  'mallorca':          'Estadi de Son Moix',
  'real oviedo':       'Estadio Carlos Tartiere',
  'real sociedad ii':  'Estadio Zubieta XXI',
  'real valladolid':   'Estadio José Zorrilla',
  'cd sabadell':       'Estadio Municipal Nova Creu Alta',
  'sporting gijón':    'Estadio El Molinón',
  'tenerife':          'Estadio Heliodoro Rodríguez López',
}

// Precomputed once at module load — STADIUMS is static, no need to re-normalize on every call.
const NORMALIZED_STADIUMS: { key: string; value: string }[] = Object.entries(STADIUMS).map(([k, v]) => ({
  key: stripAccents(k),
  value: v,
}))

export function getStadium(teamName: string): string | null {
  if (!teamName) return null
  const key = stripAccents(teamName.toLowerCase()).trim()
  // exact match (sin acentos)
  const exact = NORMALIZED_STADIUMS.find((s) => s.key === key)
  if (exact) return exact.value
  // partial match — por si el nombre viene con prefijo/sufijo distinto
  const partial = NORMALIZED_STADIUMS.find((s) => key.includes(s.key) || s.key.includes(key))
  return partial?.value ?? null
}

// Dado un partido, devuelve el estadio donde se juega.
// isHome = true → Ceuta es local, homeTeam es "AD Ceuta" → Alfonso Murube
// isHome = false → Ceuta es visitante, homeTeam es el rival → estadio del rival
export function getMatchVenue(homeTeam: string, _awayTeam: string): string | null {
  return getStadium(homeTeam)
}
