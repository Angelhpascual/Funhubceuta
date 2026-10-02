import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrapeCareerHistory, fetchEspnRoster } from '../espnCareerScraper'

beforeEach(() => {
  vi.spyOn(global, 'fetch')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('scrapeCareerHistory', () => {
  it('returns an empty array when ESPN responds with an error', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('', { status: 503 }))
    expect(await scrapeCareerHistory('123')).toEqual([])
  })

  it('maps club history with logo and normalized seasons', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      teamHistory: [
        { displayName: 'Ceuta', seasons: '2024-CURRENT', logo: 'https://espn.com/5404.png' },
        { displayName: 'Real Betis', seasons: '2013-2014, 2015-2016' },
      ],
    }), { status: 200 }))

    const result = await scrapeCareerHistory('123')
    expect(result).toEqual([
      { club: 'Ceuta', seasons: '2024-Act.', logo: 'https://espn.com/5404.png' },
      { club: 'Real Betis', seasons: '2013-2014, 2015-2016', logo: null },
    ])
  })

  it('translates known national team names, including age-group suffixes', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      teamHistory: [
        { displayName: 'Spain', seasons: '2019-2019' },
        { displayName: 'Spain U21', seasons: '2018-2019' },
      ],
    }), { status: 200 }))

    const result = await scrapeCareerHistory('123')
    expect(result[0].club).toBe('España')
    expect(result[1].club).toBe('España SUB-21')
  })

  it('translates an unlisted "Country U##" name generically', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      teamHistory: [{ displayName: 'Chile U20', seasons: '2017-2017' }],
    }), { status: 200 }))

    const result = await scrapeCareerHistory('123')
    expect(result[0].club).toBe('Chile SUB-20')
  })

  it('leaves an unknown club/country name untouched', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      teamHistory: [{ displayName: 'FC Twente', seasons: '2019-2020' }],
    }), { status: 200 }))

    const result = await scrapeCareerHistory('123')
    expect(result[0].club).toBe('FC Twente')
  })

  it('returns an empty array when teamHistory is missing', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    expect(await scrapeCareerHistory('123')).toEqual([])
  })
})

describe('fetchEspnRoster', () => {
  it('returns an empty array when ESPN responds with an error', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response('', { status: 503 }))
    expect(await fetchEspnRoster()).toEqual([])
  })

  it('maps athletes to espnId/name pairs', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({
      athletes: [{ id: 183413, displayName: 'Pedro López' }, { id: '218218', displayName: 'Guillermo' }],
    }), { status: 200 }))

    const result = await fetchEspnRoster()
    expect(result).toEqual([
      { espnId: '183413', name: 'Pedro López' },
      { espnId: '218218', name: 'Guillermo' },
    ])
  })

  it('returns an empty array when athletes is missing', async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    expect(await fetchEspnRoster()).toEqual([])
  })
})
