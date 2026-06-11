import { launchBrowser } from '@/infrastructure/browser'

export interface ScrapedPlayer {
  dorsal: number | null
  name: string
  position: string
  positionGroup: string
  nationality: string
  height: string | null
  weight: string | null
  birthDate: string | null
  photoUrl: string | null
}

const GROUP_MAP: Record<string, string> = {
  PORTERO: 'Porteros',
  DEFENSA: 'Defensas',
  LATERAL: 'Defensas',
  CENTRAL: 'Defensas',
  MEDIOCENTRO: 'Centrocampistas',
  MEDIAPUNTA: 'Centrocampistas',
  CENTROCAMPISTA: 'Centrocampistas',
  EXTREMO: 'Centrocampistas',
  DELANTERO: 'Delanteros',
  ENTRENADOR: 'Cuerpo técnico',
  'SEGUNDO ENTRENADOR': 'Cuerpo técnico',
  'PREPARADOR FÍSICO': 'Cuerpo técnico',
  PORTEROS: 'Cuerpo técnico',
}

export async function scrapeSquad(): Promise<ScrapedPlayer[]> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  )

  try {
    await page.setViewport({ width: 1280, height: 900 })
    await page.goto('https://www.laliga.com/clubes/ad-ceuta-fc/plantilla', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })
    await new Promise((r) => setTimeout(r, 3000))

    // Scroll to trigger lazy-loaded images
    for (let i = 0; i < 12; i++) {
      await page.evaluate((step: number) => window.scrollBy(0, step * 500), i)
      await new Promise((r) => setTimeout(r, 300))
    }
    await new Promise((r) => setTimeout(r, 2000))

    const raw = await page.evaluate(() => {
      const cards = Array.from(
        document.querySelectorAll('[class*="PlayerCard"],[class*="player-card"]')
      )
      return cards.map((card) => {
        const el = card as HTMLElement
        const text = el.innerText ?? ''
        const numEl = card.querySelector(
          '[class*="Dorsal"],[class*="Number"],[class*="dorsal"]'
        ) as HTMLElement | null
        const photo = Array.from(card.querySelectorAll('img')).find((img) =>
          (img as HTMLImageElement).src.includes('assets.laliga.com/squad')
        ) as HTMLImageElement | undefined
        return {
          text,
          num: numEl?.innerText?.trim() ?? null,
          photoUrl: photo?.src ?? null,
        }
      })
    })

    const NATIONALITIES = [
      'ESPAÑA',
      'MALI',
      'SENEGAL',
      'GUINEA',
      'GUINEA-BISÁU',
      'GUINEA BISÁU',
      'ARGENTINA',
      'URUGUAY',
      'COLOMBIA',
      'FRANCIA',
      'MARRUECOS',
      'ARGELIA',
      'CAMERÚN',
      'BRASIL',
      'PORTUGAL',
      'SENEGAL',
      'GHANA',
      'COSTA DE MARFIL',
      'NIGERIA',
    ]

    const players = raw
      .map(({ text, num, photoUrl }): ScrapedPlayer | null => {
        const parts = text
          .split('\n')
          .map((l: string) => l.trim())
          .filter(Boolean)
        if (parts.length < 2) return null

        const dorsalNum = parseInt(parts[0])
        const nameIdx = !isNaN(dorsalNum) ? 1 : 0
        const name = parts[nameIdx]
        if (!name || name === 'AD Ceuta FC') return null

        const position =
          parts.find(
            (p: string) =>
              p === p.toUpperCase() &&
              p.length > 3 &&
              !p.includes('CEUTA') &&
              !NATIONALITIES.includes(p) &&
              isNaN(parseInt(p)) &&
              !p.match(/^\d+\s*(CM|KG|cm|kg)/i)
          ) ?? ''

        // Extract height (e.g. "180 cm", "1,80 m", "180Cm")
        const heightPart = parts.find(
          (p: string) => /^\d{2,3}\s*(cm|Cm|CM)$/.test(p) || /^1[,\.]\d{2}\s*m$/i.test(p)
        )
        const height = heightPart ?? null

        // Extract weight (e.g. "80 kg", "80Kg")
        const weightPart = parts.find((p: string) => /^\d{2,3}\s*(kg|Kg|KG)$/.test(p))
        const weight = weightPart ?? null

        // Nationality: a part that matches known nationalities OR is all-caps text that's not position/weight/height
        const nationality =
          parts.find((p: string) => NATIONALITIES.includes(p.toUpperCase())) ??
          parts.find(
            (p: string) =>
              p === p.toUpperCase() &&
              p.length > 3 &&
              !p.includes('CEUTA') &&
              p !== position &&
              isNaN(parseInt(p)) &&
              !p.match(/^\d+\s*(CM|KG|cm|kg)/i)
          ) ??
          ''

        const positionGroup = GROUP_MAP[position.toUpperCase()] ?? 'Jugadores'

        return {
          dorsal: !isNaN(dorsalNum) ? dorsalNum : num ? parseInt(num) : null,
          name,
          position,
          positionGroup,
          nationality,
          height,
          weight,
          birthDate: null,
          photoUrl: photoUrl ?? null,
        }
      })
      .filter((p): p is ScrapedPlayer => p !== null)

    return players.filter((p) => p.positionGroup !== 'Cuerpo técnico')
  } finally {
    await browser.close()
  }
}
