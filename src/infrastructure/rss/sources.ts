export interface RssSource {
  id: string
  name: string
  url: string
  // Empty array = sin filtro (feed ya es específico del club)
  keywords: string[]
}

// Keywords that unambiguously identify the club — at least one must match
export const BASE_KEYWORDS = [
  'ad ceuta', 'ceuta fc', 'ceuta f.c', 'adceuta', 'murube', 'caballas',
  'el ceuta',   // "el Ceuta confirma", "adiós al Ceuta"
  'del ceuta',  // "jugador del Ceuta"
  'al ceuta',   // "ficha al Ceuta"
  ' ceuta ',    // " Ceuta de José Juan" — rodeado de espacios para evitar "Ceutamérica"
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
  'zalazar', 'bassinga', 'rubén díez', 'cristian rodríguez', 'koné ceuta',
  // Presidente y club
  'luhay hamido',
]

export const CEUTA_KEYWORDS = [...BASE_KEYWORDS, ...SQUAD_KEYWORDS]

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
    url: 'https://www.elpueblodeceuta.es/rss/deportes/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'marca',
    name: 'Marca',
    url: 'https://www.marca.com/rss/futbol/segunda-division.xml',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'mundodeportivo',
    name: 'Mundo Deportivo',
    url: 'https://www.mundodeportivo.com/rss/futbol.xml',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: '20minutos',
    name: '20 Minutos',
    url: 'https://www.20minutos.es/rss/deportes/futbol/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'elmundo',
    name: 'El Mundo',
    url: 'https://www.elmundo.es/rss/deportes.xml',
    keywords: CEUTA_KEYWORDS,
  },
]
