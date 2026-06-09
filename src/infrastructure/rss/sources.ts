export interface RssSource {
  id: string
  name: string
  url: string
  // Empty array = no filter (feed already scoped to the club)
  keywords: string[]
  // Override BASE_KEYWORDS for this source only.
  // Use for national press feeds where "Ceuta" alone (surrounded by spaces)
  // is unambiguous in a football context, but would match non-football content
  // in city-wide sports feeds like El Pueblo.
  baseKeywords?: string[]
}

// Keywords that unambiguously identify the club — at least one must match.
// Conservative: no standalone "ceuta" to avoid matching non-football city news.
export const BASE_KEYWORDS = [
  'ad ceuta', 'ceuta fc', 'ceuta f.c', 'adceuta', 'murube', 'caballas',
  'el ceuta',   // "el Ceuta confirma", "adiós al Ceuta"
  'del ceuta',  // "jugador del Ceuta"
  'al ceuta',   // "ficha al Ceuta"
]

// Extended base keywords for national football press.
// These feeds are football-only so standalone "ceuta" is safe there.
const BASE_KEYWORDS_NATIONAL = [
  ...BASE_KEYWORDS,
  ' ceuta ',    // "el recién ascendido Ceuta de José Juan"
  'con ceuta',  // "en su temporada con Ceuta"
]

// Player full-name or unique identifiers — used as secondary match
const SQUAD_KEYWORDS = [
  // Porteros
  'pedro lópez', 'pery garcia', 'jose juan romero',
  // Defensas
  'manu sánchez', 'carlos hernández', 'diego gonzález',
  'redruello', 'almenara', 'antonio josé sánchez',
  // Centrocampistas
  'youness lachhab', 'aisar ahmed', 'marino illescas',
  'bodiger', 'salvi sánchez', 'adri rueda', 'josema ceuta',
  // Delanteros
  'zalazar', 'bassinga', 'cristian rodríguez', 'koné ceuta',
  // Presidente y club
  'luhay hamido',
]

export const CEUTA_KEYWORDS = [...BASE_KEYWORDS, ...SQUAD_KEYWORDS]
const CEUTA_KEYWORDS_NATIONAL = [...BASE_KEYWORDS_NATIONAL, ...SQUAD_KEYWORDS]

export const RSS_SOURCES: RssSource[] = [
  {
    id: 'oficial',
    name: 'AD Ceuta FC',
    url: 'https://adceutafc.com/noticias/feed/',
    keywords: [], // feed oficial del club — sin filtro
  },
  {
    id: 'faro',
    name: 'El Faro de Ceuta',
    url: 'https://elfarodeceuta.es/tag/ad-ceuta/feed/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'elpueblo',
    name: 'El Pueblo de Ceuta',
    url: 'https://www.elpueblodeceuta.es/rss/category/section/20269/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'marca',
    name: 'Marca',
    url: 'https://www.marca.com/rss/futbol/segunda-division.xml',
    keywords: CEUTA_KEYWORDS_NATIONAL,
    baseKeywords: BASE_KEYWORDS_NATIONAL,
  },
  {
    id: 'mundodeportivo',
    name: 'Mundo Deportivo',
    url: 'https://www.mundodeportivo.com/rss/futbol.xml',
    keywords: CEUTA_KEYWORDS_NATIONAL,
    baseKeywords: BASE_KEYWORDS_NATIONAL,
  },
  {
    id: '20minutos',
    name: '20 Minutos',
    url: 'https://www.20minutos.es/rss/deportes/futbol/',
    keywords: CEUTA_KEYWORDS_NATIONAL,
    baseKeywords: BASE_KEYWORDS_NATIONAL,
  },
  {
    id: 'sport',
    name: 'Sport',
    url: 'https://www.sport.es/es/rss/futbol/rss.xml',
    keywords: CEUTA_KEYWORDS_NATIONAL,
    baseKeywords: BASE_KEYWORDS_NATIONAL,
  },
  {
    id: 'as',
    name: 'AS',
    url: 'https://feeds.as.com/mrss-s/pages/as/site/as.com/section/futbol/subsection/segunda',
    keywords: CEUTA_KEYWORDS_NATIONAL,
    baseKeywords: BASE_KEYWORDS_NATIONAL,
  },
  {
    id: 'ceutatv',
    name: 'Ceuta Televisión',
    url: 'https://www.ceutatv.com/rss/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'ceutaactualidad',
    name: 'Ceuta Actualidad',
    url: 'https://www.ceutaactualidad.com/rss/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'rtvc',
    name: 'RTV Ceuta',
    url: 'https://www.rtvce.es/rss/',
    keywords: CEUTA_KEYWORDS,
  },
]
