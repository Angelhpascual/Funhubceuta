import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/infrastructure/browser', () => ({ launchBrowser: vi.fn() }))
vi.mock('../teamLogos', () => ({ getTeamLogo: vi.fn((name: string) => `local-logo-${name}`) }))

import { launchBrowser } from '@/infrastructure/browser'
import { getTeamLogo } from '../teamLogos'
import { scrapeStandings } from '../laligaScraper'

type Row = {
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
}

function makeRow(position: number, overrides: Partial<Row> = {}): Row {
  return {
    position,
    teamName: `Equipo ${position}`,
    teamLogo: 'https://laliga.com/escudo.png',
    points: 50,
    played: 30,
    won: 14,
    drawn: 8,
    lost: 8,
    goalsFor: 40,
    goalsAgainst: 30,
    goalDifference: 10,
    ...overrides,
  }
}

function mockBrowser(rows: Row[]) {
  const page = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate: vi.fn().mockResolvedValue(rows),
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(launchBrowser).mockResolvedValue(browser as never)
  return { page, browser }
}

async function runScrape(season: string) {
  const promise = scrapeStandings(season)
  // scrapeStandings waits 8s (real page render time) before reading the DOM
  await vi.advanceTimersByTimeAsync(8000)
  return promise
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('scrapeStandings', () => {
  it('closes the browser after scraping', async () => {
    const { browser } = mockBrowser([makeRow(1)])
    await runScrape('2026-2027')
    expect(browser.close).toHaveBeenCalled()
  })

  it('builds externalId from season and position, and resolves the local team logo', async () => {
    mockBrowser([makeRow(1, { teamName: 'AD Ceuta FC' })])
    const result = await runScrape('2026-2027')
    expect(result[0].externalId).toBe('2026-2027-1')
    expect(result[0].season).toBe('2026-2027')
    expect(getTeamLogo).toHaveBeenCalledWith('AD Ceuta FC')
    expect(result[0].teamLogo).toBe('local-logo-AD Ceuta FC')
  })

  it('deduplicates rows that share the same position (other leagues bleeding into the DOM query)', async () => {
    mockBrowser([makeRow(1), makeRow(1, { teamName: 'Duplicado' }), makeRow(2)])
    const result = await runScrape('2026-2027')
    expect(result).toHaveLength(2)
    expect(result[0].teamName).toBe('Equipo 1') // first occurrence wins
  })

  it('caps the result at 22 teams (Segunda División size)', async () => {
    const rows = Array.from({ length: 30 }, (_, i) => makeRow(i + 1))
    mockBrowser(rows)
    const result = await runScrape('2026-2027')
    expect(result).toHaveLength(22)
  })

  it('tags positions 1-2 as Promotion', async () => {
    mockBrowser([makeRow(1), makeRow(2)])
    const result = await runScrape('2026-2027')
    expect(result.every((r) => r.description === 'Promotion')).toBe(true)
  })

  it('tags positions 3-6 as Promotion Playoff', async () => {
    mockBrowser([makeRow(1), makeRow(2), makeRow(3), makeRow(4), makeRow(5), makeRow(6)])
    const result = await runScrape('2026-2027')
    expect(result.slice(2).every((r) => r.description === 'Promotion Playoff')).toBe(true)
  })

  it('tags the bottom 3 of a 22-team table as Relegation', async () => {
    const rows = Array.from({ length: 22 }, (_, i) => makeRow(i + 1))
    mockBrowser(rows)
    const result = await runScrape('2026-2027')
    expect(result.slice(-3).every((r) => r.description === 'Relegation')).toBe(true)
    expect(result[10].description).toBe('') // mid-table, no tag
  })
})
