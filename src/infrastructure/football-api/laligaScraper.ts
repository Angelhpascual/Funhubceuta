import { launchBrowser } from '@/infrastructure/browser'
import { StandingEntry } from '@/domain/standings/Standings'
import { getTeamLogo } from './teamLogos'

export async function scrapeStandings(
  season: string
): Promise<Omit<StandingEntry, 'id' | 'createdAt' | 'updatedAt'>[]> {
  const browser = await launchBrowser()
  const page = await browser.newPage()

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  )

  await page.goto('https://www.laliga.com/laliga-hypermotion/clasificacion', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  })

  await new Promise((r) => setTimeout(r, 8000))

  const rows = await page.evaluate(() => {
    const results: {
      position: number
      teamName: string
      teamLogo: string | null
      points: number
      played: number
      won: number
      drawn: number
      lost: number
      goalsFor: number
      goalsAgainst: number
      goalDifference: number
    }[] = []

    const accordions = document.querySelectorAll('[class*="ContainerAccordion"]')

    accordions.forEach((accordion) => {
      const tds = Array.from(accordion.querySelectorAll('[class*="Td-sc"]'))
      if (tds.length < 10) return

      const getText = (el: Element) => el.textContent?.trim() ?? ''

      const position = parseInt(getText(tds[1]))
      if (isNaN(position)) return

      // team name: remove the short code prefix (e.g. "RAC" from "RACR. Racing Club")
      const rawTeam = getText(tds[2])
      const desktopShield = tds[2].querySelector('[class*="shield-desktop"] p')
      const teamName = desktopShield?.textContent?.trim() ?? rawTeam
      const teamLogo = tds[2].querySelector('img')?.getAttribute('src') ?? null

      const points = parseInt(getText(tds[3]))
      const played = parseInt(getText(tds[4]))
      const won = parseInt(getText(tds[5]))
      const drawn = parseInt(getText(tds[6]))
      const lost = parseInt(getText(tds[7]))
      const goalsFor = parseInt(getText(tds[8]))
      const goalsAgainst = parseInt(getText(tds[9]))
      const goalDifference = goalsFor - goalsAgainst

      if (position && teamName) {
        results.push({
          position,
          teamName,
          teamLogo,
          points,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDifference,
        })
      }
    })

    return results
  })

  await browser.close()

  // keep only 22 teams (Segunda División) — filter out duplicates from other leagues
  const unique = rows
    .filter((r, i, arr) => arr.findIndex((x) => x.position === r.position) === i)
    .slice(0, 22)

  return unique.map((row) => ({
    externalId: `${season}-${row.position}`,
    season,
    form: null,
    description: getDescription(row.position, unique.length),
    ...row,
    teamLogo: getTeamLogo(row.teamName),
  }))
}

function getDescription(position: number, total: number): string {
  if (position <= 2) return 'Promotion'
  if (position <= 6) return 'Promotion Playoff'
  if (position >= total - 3) return 'Relegation'
  return ''
}
