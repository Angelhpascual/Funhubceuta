import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/infrastructure/browser', () => ({ launchBrowser: vi.fn() }))

import { launchBrowser } from '@/infrastructure/browser'
import { scrapeSquad } from '../squadScraper'

type RawPlayer = {
  dorsal: string | null
  name: string
  position: string
  nationality: string
  birth: string | null
  height: string | null
  weight: string | null
  photoUrl: string | null
}

function makeRaw(overrides: Partial<RawPlayer> = {}): RawPlayer {
  return {
    dorsal: '9',
    name: 'Jordi Escobar',
    position: 'DELANTERO',
    nationality: 'España',
    birth: '21/01/1995',
    height: '1.87m',
    weight: '80kg',
    photoUrl: 'https://assets.laliga.com/squad/jordi.png',
    ...overrides,
  }
}

function mockBrowser(rawPlayers: RawPlayer[]) {
  // The real evaluate() is called 20 times with a scroll step arg (returns
  // nothing useful), then once with no args to extract the actual data —
  // mirror that shape so the scrape's final result reflects rawPlayers.
  const evaluate = vi.fn().mockImplementation((_fn: unknown, ...args: unknown[]) =>
    args.length > 0 ? undefined : rawPlayers
  )
  const page = {
    setUserAgent: vi.fn().mockResolvedValue(undefined),
    setViewport: vi.fn().mockResolvedValue(undefined),
    goto: vi.fn().mockResolvedValue(undefined),
    evaluate,
  }
  const browser = {
    newPage: vi.fn().mockResolvedValue(page),
    close: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(launchBrowser).mockResolvedValue(browser as never)
  return { page, browser }
}

async function runScrape() {
  const promise = scrapeSquad()
  // Page waits + 20 scroll steps (300ms each) + 2 trailing waits ≈ 11s total
  await vi.advanceTimersByTimeAsync(15_000)
  return promise
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('scrapeSquad', () => {
  it('closes the browser even when scraping throws', async () => {
    const { browser, page } = mockBrowser([])
    page.goto.mockRejectedValue(new Error('timeout'))
    // Fails before any setTimeout is reached — no timer advance needed, and
    // attaching the rejection handler immediately avoids an unhandled one.
    await expect(scrapeSquad()).rejects.toThrow('timeout')
    expect(browser.close).toHaveBeenCalled()
  })

  it('maps a raw player to the final shape: dorsal parsed, position group resolved, height/weight/birthDate normalized', async () => {
    mockBrowser([makeRaw()])
    const result = await runScrape()
    expect(result).toEqual([{
      dorsal: 9,
      name: 'Jordi Escobar',
      position: 'DELANTERO',
      positionGroup: 'Delanteros',
      nationality: 'España',
      height: '187',
      weight: '80kg',
      birthDate: '1995-01-21',
      photoUrl: 'https://assets.laliga.com/squad/jordi.png',
    }])
  })

  it('maps every position keyword to its group', async () => {
    mockBrowser([
      makeRaw({ name: 'GK', position: 'PORTERO' }),
      makeRaw({ name: 'CB', position: 'CENTRAL' }),
      makeRaw({ name: 'LB', position: 'LATERAL' }),
      makeRaw({ name: 'DM', position: 'MEDIOCENTRO' }),
      makeRaw({ name: 'AM', position: 'MEDIAPUNTA' }),
      makeRaw({ name: 'W', position: 'EXTREMO' }),
      makeRaw({ name: 'CF', position: 'DELANTERO' }),
    ])
    const result = await runScrape()
    expect(result.map((p) => p.positionGroup)).toEqual([
      'Porteros', 'Defensas', 'Defensas', 'Centrocampistas', 'Centrocampistas', 'Centrocampistas', 'Delanteros',
    ])
  })

  it('filters out coaching staff (Cuerpo técnico)', async () => {
    mockBrowser([
      makeRaw({ name: 'Jugador', position: 'DELANTERO' }),
      makeRaw({ name: 'Entrenador', position: 'ENTRENADOR' }),
      makeRaw({ name: 'Segundo', position: 'SEGUNDO ENTRENADOR' }),
    ])
    const result = await runScrape()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Jugador')
  })

  it('filters out entries with no name', async () => {
    mockBrowser([makeRaw({ name: '' }), makeRaw({ name: 'Real' })])
    const result = await runScrape()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Real')
  })

  it('treats a missing dorsal ("-") or empty height/weight as null, not a parse error', async () => {
    mockBrowser([makeRaw({ dorsal: null, height: '-', weight: '-' })])
    const result = await runScrape()
    expect(result[0].dorsal).toBeNull()
    expect(result[0].height).toBeNull()
    expect(result[0].weight).toBeNull()
  })

  it('nulls out the default placeholder photo', async () => {
    mockBrowser([makeRaw({ photoUrl: 'https://assets.laliga.com/squad/default/player.png' })])
    const result = await runScrape()
    expect(result[0].photoUrl).toBeNull()
  })

  it('falls back to "Jugadores" for an unmapped position label', async () => {
    mockBrowser([makeRaw({ position: 'CAPITÁN' })])
    const result = await runScrape()
    expect(result[0].positionGroup).toBe('Jugadores')
  })
})
