import { launchBrowser } from '@/infrastructure/browser'

export interface ScrapedPlayer {
  dorsal: number | null
  name: string
  position: string
  positionGroup: string
  nationality: string
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
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

  try {
    await page.goto('https://www.laliga.com/clubes/ad-ceuta-fc/plantilla', {
      waitUntil: 'networkidle2',
      timeout: 20000,
    })
    await new Promise(r => setTimeout(r, 4000))

    const raw = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="PlayerCard"],[class*="player-card"]'))
      return cards.map(card => {
        const text = (card as HTMLElement).innerText ?? ''
        const num = card.querySelector('[class*="Dorsal"],[class*="Number"],[class*="dorsal"]')
        return { text, num: (num as HTMLElement)?.innerText?.trim() ?? null }
      })
    })

    const players: ScrapedPlayer[] = []

    for (const { text, num } of raw) {
      // text format: "1\n\nPedro López\n\nAD Ceuta FC\n\nPORTERO\n\nEspaña"
      const parts = text.split('\n').map(l => l.trim()).filter(Boolean)
      if (parts.length < 2) continue

      // Skip if first part is a number (dorsal) — shift it
      let idx = 0
      const dorsalNum = parseInt(parts[0])
      if (!isNaN(dorsalNum)) idx = 1

      const name = parts[idx]
      if (!name || name === 'AD Ceuta FC') continue

      // Skip team name line
      const position = parts.find(p =>
        p === p.toUpperCase() && p.length > 3 && !p.includes('CEUTA') && !['ESPAÑA', 'MALI', 'SENEGAL', 'GUINEA', 'ARGENTINA', 'URUGUAY', 'COLOMBIA'].includes(p)
      ) ?? ''

      const nationality = parts[parts.length - 1] ?? ''

      const posUpper = position.toUpperCase()
      const positionGroup = GROUP_MAP[posUpper] ?? 'Jugadores'

      players.push({
        dorsal: !isNaN(dorsalNum) ? dorsalNum : (num ? parseInt(num) : null),
        name,
        position,
        positionGroup,
        nationality,
      })
    }

    return players.filter(p => p.positionGroup !== 'Cuerpo técnico')
  } finally {
    await browser.close()
  }
}
