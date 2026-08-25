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

// LaLiga's squad page (2026 rebuild) is built on an atomic/utility CSS system whose
// class names are hashed and unstable across deploys. We anchor extraction on the
// player photo link (`a.link` wrapping an `assets.laliga.com/squad` image), which is
// semantically stable, then walk to its card via DOM position rather than class name.
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
    for (let i = 0; i < 20; i++) {
      await page.evaluate((step: number) => window.scrollBy(0, step * 500), i)
      await new Promise((r) => setTimeout(r, 300))
    }
    await new Promise((r) => setTimeout(r, 2000))

    const raw = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a.link')).filter((a) => {
        const img = a.querySelector('img') as HTMLImageElement | null
        return img?.src?.includes('assets.laliga.com/squad')
      })

      return links
        .map((a) => {
          const card = a.parentElement?.parentElement
          if (!card) return null
          const img = a.querySelector('img') as HTMLImageElement | null
          const dorsalEl = card.querySelector('p[class*="players.l"]') as HTMLElement | null
          const nameEl = card.querySelector('p[class*="players.m"]') as HTMLElement | null
          const posEl = card.querySelector('p[class*="text.xsBold"]') as HTMLElement | null
          const natEl = card.querySelector('p[class*="text.sRegular"]') as HTMLElement | null
          const labels = Array.from(card.querySelectorAll('p[class*="label.labelSRegular"]'))
          const info: Record<string, string> = {}
          for (const lbl of labels) {
            const key = lbl.textContent?.trim()
            const val = (lbl.nextElementSibling as HTMLElement | null)?.textContent?.trim()
            if (key && val) info[key] = val
          }
          return {
            dorsal: dorsalEl?.textContent?.trim() || null,
            name: nameEl?.textContent?.trim() ?? '',
            position: posEl?.textContent?.trim() ?? '',
            nationality: natEl?.textContent?.trim() ?? '',
            birth: info['Nacimiento'] ?? null,
            height: info['Altura'] ?? null,
            weight: info['Peso'] ?? null,
            photoUrl: img?.src ?? null,
          }
        })
        .filter((p): p is NonNullable<typeof p> => p !== null)
    })

    // "1.87m" → "187" (cm, unit appended by the UI); "-" → null
    function parseHeightCm(h: string | null): string | null {
      if (!h || h === '-') return null
      const m = h.match(/(\d)[.,](\d{2})/)
      return m ? `${m[1]}${m[2]}` : null
    }
    function parseWeight(w: string | null): string | null {
      if (!w || w === '-') return null
      return w
    }
    // "21/01/1995" → "1995-01-21"
    function parseBirthDate(b: string | null): string | null {
      if (!b) return null
      const m = b.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      return m ? `${m[3]}-${m[2]}-${m[1]}` : null
    }

    const players: ScrapedPlayer[] = raw.map((p) => ({
      dorsal: p.dorsal ? parseInt(p.dorsal) : null,
      name: p.name,
      position: p.position,
      positionGroup: GROUP_MAP[p.position.toUpperCase()] ?? 'Jugadores',
      nationality: p.nationality,
      height: parseHeightCm(p.height),
      weight: parseWeight(p.weight),
      birthDate: parseBirthDate(p.birth),
      photoUrl: p.photoUrl?.includes('/default/') ? null : p.photoUrl,
    }))

    return players.filter((p) => p.name && p.positionGroup !== 'Cuerpo técnico')
  } finally {
    await browser.close()
  }
}
