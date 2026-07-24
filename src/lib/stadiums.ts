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
  'rc celta fortuna':  'Abanca-Balaídos (filial)',
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
  'real sociedad ii':  'Estadio Zubieta',
  'real valladolid':   'Estadio José Zorrilla',
  'cd sabadell':       'Estadio Nova Creu Alta',
  'sporting gijón':    'Estadio El Molinón',
  'tenerife':          'Estadio Heliodoro Rodríguez López',
}

export function getStadium(teamName: string): string | null {
  if (!teamName) return null
  const key = teamName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
  // exact match (sin acentos)
  for (const [k, v] of Object.entries(STADIUMS)) {
    const normK = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (key === normK) return v
  }
  // partial match — por si el nombre viene con prefijo/sufijo distinto
  for (const [k, v] of Object.entries(STADIUMS)) {
    const normK = k.normalize('NFD').replace(/[̀-ͯ]/g, '')
    if (key.includes(normK) || normK.includes(key)) return v
  }
  return null
}

// Dado un partido, devuelve el estadio donde se juega.
// isHome = true → Ceuta es local, homeTeam es "AD Ceuta" → Alfonso Murube
// isHome = false → Ceuta es visitante, homeTeam es el rival → estadio del rival
export function getMatchVenue(homeTeam: string, _awayTeam: string): string | null {
  return getStadium(homeTeam)
}
