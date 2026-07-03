import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '../client'
import { fetchSquadBySeason, fetchPlayerById } from '../SquadSupabaseRepository'

beforeEach(() => { vi.resetAllMocks() })

function mockSelect(data: unknown) {
  const eqChain: Record<string, unknown> = {
    order: vi.fn().mockResolvedValue({ data }),
    single: vi.fn().mockResolvedValue({ data }),
  }
  eqChain.eq = vi.fn().mockReturnValue(eqChain)

  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(eqChain),
    }),
  } as never)
}

const makePlayer = (overrides = {}) => ({
  id: 'p1', dorsal: 9, name: 'Jugador Test',
  position: 'Delantero', position_group: 'Delanteros',
  nationality: 'ESP', height: null, weight: null,
  birth_date: null, photo_url: null, career_history: null, bio: null, season: '2025-2026',
  ...overrides,
})

describe('fetchSquadBySeason', () => {
  it('returns empty grouped and zero total when no players', async () => {
    mockSelect([])
    const { grouped, total } = await fetchSquadBySeason('2025-2026')
    expect(grouped).toEqual([])
    expect(total).toBe(0)
  })

  it('groups players by position_group in correct order', async () => {
    const players = [
      makePlayer({ position_group: 'Delanteros', name: 'Delantero' }),
      makePlayer({ id: 'p2', position_group: 'Porteros', name: 'Portero' }),
      makePlayer({ id: 'p3', position_group: 'Defensas', name: 'Defensa' }),
    ]
    mockSelect(players)
    const { grouped, total } = await fetchSquadBySeason('2025-2026')
    expect(total).toBe(3)
    expect(grouped[0].group).toBe('Porteros')
    expect(grouped[1].group).toBe('Defensas')
    expect(grouped[2].group).toBe('Delanteros')
  })

  it('maps null position/position_group to empty string', async () => {
    mockSelect([makePlayer({ position: null, position_group: null })])
    const { grouped } = await fetchSquadBySeason('2025-2026')
    // null position_group goes to 'Otros' which is not in GROUP_ORDER, so not in grouped
    expect(grouped).toHaveLength(0)
  })
})

describe('fetchPlayerById', () => {
  it('returns player data', async () => {
    const player = makePlayer()
    mockSelect(player)
    const result = await fetchPlayerById('p1', '2025-2026')
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Jugador Test')
  })

  it('returns null when not found', async () => {
    mockSelect(null)
    const result = await fetchPlayerById('nonexistent', '2025-2026')
    expect(result).toBeNull()
  })
})
