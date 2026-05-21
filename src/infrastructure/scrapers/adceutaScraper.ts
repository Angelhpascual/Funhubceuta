import { launchBrowser } from '@/infrastructure/browser'

export interface ScrapedMatch {
  homeTeam: string
  awayTeam: string
  date: string    // YYYY-MM-DD
  time: string    // HH:MM
  weekday: string
  isHome: boolean
  ticketsUrl: string | null
}

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
}

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function parseDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+de\s+(\w+),?\s+(\d{4})/)
  if (!m) return null
  const month = MONTHS[m[2].toLowerCase()]
  if (!month) return null
  return new Date(parseInt(m[3]), month - 1, parseInt(m[1])).toISOString().split('T')[0]
}

export async function scrapeNextMatches(): Promise<ScrapedMatch[]> {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')

  try {
    await page.goto('https://adceutafc.com/partidos-adceutafc/', { waitUntil: 'networkidle2', timeout: 20000 })
    await new Promise(r => setTimeout(r, 2000))

    const { text, ticketsUrl } = await page.evaluate(() => {
      const body = document.body.innerText
      const links = Array.from(document.querySelectorAll('a[href*="entrad"]'))
      const ticketsUrl = links[0]?.getAttribute('href') ?? null
      return { text: body, ticketsUrl }
    })

    // Extract "PRÓXIMOS PARTIDOS" section
    const start = text.indexOf('PRÓXIMOS PARTIDOS')
    const end = text.indexOf('RESULTADOS PARTIDOS', start)
    if (start === -1) return []

    const section = text.slice(start + 'PRÓXIMOS PARTIDOS'.length, end > -1 ? end : start + 3000)
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean)

    const matches: ScrapedMatch[] = []
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      if (WEEKDAYS.some(d => line === d)) {
        const dateLine = lines[i + 1] ?? ''
        const timeLine = lines[i + 2] ?? ''
        const homeLine = lines[i + 3] ?? ''
        const separator = lines[i + 4] ?? ''
        const awayLine  = lines[i + 5] ?? ''

        const date = parseDate(dateLine)
        const isTime = /^\d{2}:\d{2}$/.test(timeLine)
        const isSep  = separator === '–' || separator === '-'

        if (date && isTime && isSep && homeLine && awayLine) {
          matches.push({
            homeTeam: homeLine,
            awayTeam: awayLine,
            date,
            time: timeLine,
            weekday: line,
            isHome: homeLine.toLowerCase().includes('ceuta'),
            ticketsUrl,
          })
          i += 6
          continue
        }
      }
      i++
    }

    return matches
  } finally {
    await browser.close()
  }
}

export async function scrapeNextMatch(): Promise<ScrapedMatch | null> {
  const all = await scrapeNextMatches()
  const today = new Date().toISOString().split('T')[0]
  return all.find(m => m.date >= today) ?? null
}
