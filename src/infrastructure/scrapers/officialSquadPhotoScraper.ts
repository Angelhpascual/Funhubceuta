import { launchBrowser } from '@/infrastructure/browser'

export interface OfficialPlayerPhoto {
  dorsal: number
  photoUrl: string
}

// LaLiga's own photos lag behind new signings/renumbering, so the admin
// wants the club's official site (adceutafc.com) as the source of truth for
// photos specifically — stats (height/weight/birthDate) stay from LaLiga
// since the official site only exposes age, not an exact birth date or weight.
export async function scrapeOfficialSquadPhotos(): Promise<OfficialPlayerPhoto[]> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
  )

  try {
    await page.goto('https://adceutafc.com/equipo/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    })

    const raw = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.jugador-card'))
      return cards
        .map((card) => {
          const img = card.querySelector('img') as HTMLImageElement | null
          const lines = (card.textContent ?? '')
            .replace('Leer más', '')
            .trim()
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
          const dorsal = lines.length > 1 && /^\d+$/.test(lines[0]) ? lines[0] : null
          // Images are lazy-loaded: the real URL lives in data-lazy-src until
          // the browser scrolls it into view, while `src` stays a placeholder.
          const photoUrl = img?.getAttribute('data-lazy-src') ?? img?.src ?? null
          return { dorsal, photoUrl }
        })
        .filter((p): p is { dorsal: string; photoUrl: string } =>
          p.dorsal !== null && p.photoUrl !== null && !p.photoUrl.includes('Default-photo')
        )
    })

    return raw.map((p) => ({ dorsal: parseInt(p.dorsal, 10), photoUrl: p.photoUrl }))
  } finally {
    await browser.close()
  }
}
