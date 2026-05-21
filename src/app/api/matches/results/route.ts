import { NextResponse } from 'next/server'
import { launchBrowser } from '@/infrastructure/browser'

// Scrape last 5 results for AD Ceuta and return W/D/L form
export const revalidate = 3600

export async function GET() {
  try {
    const browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
    await page.goto('https://adceutafc.com/partidos-adceutafc/', { waitUntil: 'networkidle2', timeout: 20000 })
    await new Promise(r => setTimeout(r, 2000))

    const { text } = await page.evaluate(() => ({ text: document.body.innerText }))
    await browser.close()

    const start = text.indexOf('RESULTADOS PARTIDOS')
    if (start === -1) return NextResponse.json({ form: [] })

    const section = text.slice(start + 'RESULTADOS PARTIDOS'.length, start + 4000)
    const lines = section.split('\n').map(l => l.trim()).filter(Boolean)

    const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const form: string[] = []
    let i = 0

    while (i < lines.length && form.length < 5) {
      if (WEEKDAYS.some(d => lines[i] === d)) {
        const home = lines[i + 3] ?? ''
        const scoreRaw = lines[i + 4] ?? ''
        const away = lines[i + 5] ?? ''

        const scoreMatch = scoreRaw.match(/(\d+)-(\d+)/)
        if (scoreMatch) {
          const hs = parseInt(scoreMatch[1])
          const as = parseInt(scoreMatch[2])
          const ceutaHome = home.toLowerCase().includes('ceuta')
          const ceutaAway = away.toLowerCase().includes('ceuta')

          if (ceutaHome || ceutaAway) {
            const ceutaGoals = ceutaHome ? hs : as
            const oppGoals = ceutaHome ? as : hs
            if (ceutaGoals > oppGoals) form.push('W')
            else if (ceutaGoals === oppGoals) form.push('D')
            else form.push('L')
          }
          i += 6
          continue
        }
      }
      i++
    }

    return NextResponse.json({ form: form.reverse() })
  } catch {
    return NextResponse.json({ form: [] })
  }
}
