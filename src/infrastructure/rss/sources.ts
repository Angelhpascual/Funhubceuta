export interface RssSource {
  id: string
  name: string
  url: string
  // Empty array = sin filtro (feed ya es específico del club)
  keywords: string[]
}

// Plantilla AD Ceuta (fuente: laliga.com/clubes/ad-ceuta-fc/plantilla)
const SQUAD_KEYWORDS = [
  // Porteros
  'pedro lópez', 'vallejo', 'pery garcia', 'jose juan romero',
  // Defensas
  'manu sánchez', 'matos', 'capa', 'carlos hernández', 'diego gonzález',
  'redruello', 'almenara', 'yago', 'curro', 'antonio josé sánchez',
  // Centrocampistas
  'youness lachhab', 'aisar ahmed', 'schor', 'marino illescas',
  'bodiger', 'campaña', 'anuar', 'salvi sánchez', 'josema', 'adri rueda',
  // Delanteros
  'zalazar', 'marcos', 'konrad', 'bassinga', 'domenech', 'yeyo',
  'rubén díez', 'cristian rodríguez', 'koné', 'arick', 'paco f',
  // Presidente y club
  'luhay hamido',
]

const BASE_KEYWORDS = [
  'ad ceuta', 'ceuta fc', 'murube', 'hypermotion', 'segunda división', 'laliga',
]

export const CEUTA_KEYWORDS = [...BASE_KEYWORDS, ...SQUAD_KEYWORDS]

export const RSS_SOURCES: RssSource[] = [
  {
    id: 'faro',
    name: 'El Faro de Ceuta',
    url: 'https://elfarodeceuta.es/category/ad-ceuta/feed/',
    keywords: CEUTA_KEYWORDS,
  },
  {
    id: 'elpueblo',
    name: 'El Pueblo de Ceuta',
    url: 'https://www.elpueblodeceuta.es/rss/deportes/',
    keywords: CEUTA_KEYWORDS,
  },
]
