// Static local logos bundled at build time — instant, no network request
// Generated from ESPN teamlogos, optimized to 64x64 WebP
const LOGOS: Record<string, string> = {
  albacete:     '/logos/albacete.webp',
  almeria:      '/logos/almeria.webp',
  burgos:       '/logos/burgos.webp',
  sabadell:     '/logos/sabadell.webp',
  castellon:    '/logos/castellon.webp',
  ceuta:        '/logos/ceuta.webp',
  cadiz:        '/logos/cadiz.webp',
  cordoba:      '/logos/cordoba.webp',
  eibar:        '/logos/eibar.webp',
  eldense:      '/logos/eldense.webp',
  andorra:      '/logos/andorra.webp',
  girona:       '/logos/girona.webp',
  granada:      '/logos/granada.webp',
  laspalmas:    '/logos/laspalmas.webp',
  leganes:      '/logos/leganes.webp',
  mallorca:     '/logos/mallorca.webp',
  celtafortuna: '/logos/celtafortuna.webp',
  oviedo:       '/logos/oviedo.webp',
  realsociedad2:'/logos/realsociedad2.webp',
  valladolid:   '/logos/valladolid.webp',
  sporting:     '/logos/sporting.webp',
  tenerife:     '/logos/tenerife.webp',
  // Equipos temporada 25/26 (ascendidos/descendidos)
  malaga:       '/logos/malaga.webp',
  racing:       '/logos/racing.webp',
  deportivo:    '/logos/deportivo.webp',
  huesca:       '/logos/huesca.webp',
  mirandes:     '/logos/mirandes.webp',
  zaragoza:     '/logos/zaragoza.webp',
  leonesa:      '/logos/leonesa.webp',
}

const STOPWORDS = new Set(['fc', 'cf', 'ad', 'sd', 'ud', 'cd', 'rc', 'real', 'atletico', 'deportivo', 'club', 'balompie'])

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}

function keywords(name: string): string[] {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w))
}

// Name aliases for teams whose ESPN name doesn't map cleanly
const ALIASES: Record<string, string> = {
  'ad ceuta': 'ceuta',
  'ceuta fc': 'ceuta',
  'rc celta fortuna': 'celtafortuna',
  'celta fortuna': 'celtafortuna',
  'celta vigo b': 'celtafortuna',
  'real sociedad b': 'realsociedad2',
  'real sociedad ii': 'realsociedad2',
  'las palmas': 'laspalmas',
  'deportivo alaves': 'alaves',
  'cd leganes': 'leganes',
  'cd castellon': 'castellon',
  'cordoba cf': 'cordoba',
  'sporting gijon': 'sporting',
  'real oviedo': 'oviedo',
  'real valladolid': 'valladolid',
  'fc andorra': 'andorra',
  'malaga cf': 'malaga',
  'racing santander': 'racing',
  'real racing club de santander': 'racing',
  'deportivo la coruna': 'deportivo',
  'deportivo la coruña': 'deportivo',
  'sd huesca': 'huesca',
  'cd mirandes': 'mirandes',
  'real zaragoza': 'zaragoza',
  'cultural leonesa': 'leonesa',
}

export function getLocalLogo(name: string): string | null {
  if (!name) return null

  // Try alias first
  const aliasKey = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').trim()
  if (ALIASES[aliasKey]) return LOGOS[ALIASES[aliasKey]] ?? null

  // Try exact slug match
  const slug = norm(name)
  if (LOGOS[slug]) return LOGOS[slug]

  // Try keyword match against slugs
  const kws = keywords(name)
  for (const kw of kws) {
    for (const [logoSlug, path] of Object.entries(LOGOS)) {
      if (logoSlug.includes(kw) || kw.includes(logoSlug)) return path
    }
  }

  return null
}
