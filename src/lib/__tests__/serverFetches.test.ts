import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockGetAllTeams } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetAllTeams: vi.fn(),
}))

vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/infrastructure/supabase/TeamsSupabaseRepository', () => ({
  TeamsSupabaseRepository: class {
    getAllTeams() { return mockGetAllTeams() }
  },
}))

import { fetchCeutaForm, fetchTeamLogos } from '../serverFetches'

// Helper to build a chainable Supabase query mock
function makeQuery(result: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'not', 'order', 'limit', 'single']
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain['limit'] = vi.fn().mockResolvedValue(result)
  chain['single'] = vi.fn().mockResolvedValue(result)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCeutaForm', () => {
  it('returns reversed match results when finished matches exist', async () => {
    const query = makeQuery({ data: [
      { result: 'W' },
      { result: 'D' },
      { result: 'L' },
    ]})
    mockFrom.mockReturnValue(query)

    const form = await fetchCeutaForm()
    expect(form).toEqual(['L', 'D', 'W'])
  })

  it('falls back to app_config when no finished matches', async () => {
    // First query (matches) returns empty
    const matchQuery = makeQuery({ data: [] })
    // Second query (app_config) returns config value
    const configQuery = makeQuery({ data: { value: 'W,D,L,W,W' } })

    mockFrom
      .mockReturnValueOnce(matchQuery)
      .mockReturnValueOnce(configQuery)

    const form = await fetchCeutaForm()
    expect(form).toEqual(['W', 'D', 'L', 'W', 'W'])
  })

  it('returns empty array when both sources are empty', async () => {
    const matchQuery = makeQuery({ data: [] })
    const configQuery = makeQuery({ data: null })

    mockFrom
      .mockReturnValueOnce(matchQuery)
      .mockReturnValueOnce(configQuery)

    const form = await fetchCeutaForm()
    expect(form).toEqual([])
  })

  it('filters empty strings from app_config value', async () => {
    const matchQuery = makeQuery({ data: [] })
    const configQuery = makeQuery({ data: { value: 'W,,D,,L' } })

    mockFrom
      .mockReturnValueOnce(matchQuery)
      .mockReturnValueOnce(configQuery)

    const form = await fetchCeutaForm()
    expect(form).toEqual(['W', 'D', 'L'])
  })

  it('returns at most 5 results from matches', async () => {
    // The limit(5) is applied in the query, not in the function itself,
    // so we trust the mock returns exactly what the DB would
    const query = makeQuery({ data: [
      { result: 'W' }, { result: 'W' }, { result: 'D' }, { result: 'L' }, { result: 'W' },
    ]})
    mockFrom.mockReturnValue(query)

    const form = await fetchCeutaForm()
    expect(form).toHaveLength(5)
  })
})

describe('fetchTeamLogos', () => {
  it('returns a name→logoUrl map for teams with logos', async () => {
    mockGetAllTeams.mockResolvedValue([
      { name: 'AD Ceuta FC', logoUrl: '/logos/ceuta.png' },
      { name: 'Málaga CF', logoUrl: '/logos/malaga.png' },
    ])

    const logos = await fetchTeamLogos()
    expect(logos).toEqual({
      'AD Ceuta FC': '/logos/ceuta.png',
      'Málaga CF': '/logos/malaga.png',
    })
  })

  it('omits teams without a logoUrl', async () => {
    mockGetAllTeams.mockResolvedValue([
      { name: 'AD Ceuta FC', logoUrl: '/logos/ceuta.png' },
      { name: 'Unknown FC', logoUrl: null },
    ])

    const logos = await fetchTeamLogos()
    expect(Object.keys(logos)).toHaveLength(1)
    expect(logos['Unknown FC']).toBeUndefined()
  })

  it('returns empty object when no teams have logos', async () => {
    mockGetAllTeams.mockResolvedValue([
      { name: 'Team A', logoUrl: null },
      { name: 'Team B', logoUrl: undefined },
    ])

    const logos = await fetchTeamLogos()
    expect(logos).toEqual({})
  })

  it('returns empty object when team list is empty', async () => {
    mockGetAllTeams.mockResolvedValue([])
    const logos = await fetchTeamLogos()
    expect(logos).toEqual({})
  })
})
