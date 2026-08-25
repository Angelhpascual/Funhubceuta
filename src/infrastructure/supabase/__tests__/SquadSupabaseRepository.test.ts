import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import {
  fetchSquadBySeason,
  fetchPlayerById,
  fetchPhotosByDorsal,
  upsertSquad,
  fetchSquadNames,
  updateCareerHistory,
} from '../SquadSupabaseRepository'

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

describe('fetchPhotosByDorsal', () => {
  it('returns map of dorsal → photo_url', async () => {
    const rows = [
      { dorsal: 9, photo_url: 'https://cdn.example.com/9.jpg' },
      { dorsal: 1, photo_url: 'https://cdn.example.com/1.jpg' },
    ]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: rows }),
        }),
      }),
    } as never)

    const result = await fetchPhotosByDorsal('2025-2026')
    expect(result['9']).toBe('https://cdn.example.com/9.jpg')
    expect(result['1']).toBe('https://cdn.example.com/1.jpg')
  })

  it('ignores rows with null dorsal or photo_url', async () => {
    const rows = [{ dorsal: null, photo_url: 'x' }, { dorsal: 7, photo_url: null }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: rows }),
        }),
      }),
    } as never)

    const result = await fetchPhotosByDorsal('2025-2026')
    expect(Object.keys(result)).toHaveLength(0)
  })
})

describe('upsertSquad', () => {
  const scrapedPlayer = {
    dorsal: 9, name: 'Test Player', position: 'Delantero',
    positionGroup: 'Delanteros', nationality: 'ESP',
    height: null, weight: null, birthDate: null, photoUrl: null,
  }

  it('upserts players with correct shape', async () => {
    // select for existing stored photos
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [] }),
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: selectMock, upsert: upsertMock } as never)

    await upsertSquad([scrapedPlayer], '2025-2026')

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Player',
          position_group: 'Delanteros',
          season: '2025-2026',
        }),
      ]),
      { onConflict: 'name,season', ignoreDuplicates: false }
    )
  })

  it('throws when supabase returns error', async () => {
    const selectMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: [] }),
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'db error' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ select: selectMock, upsert: upsertMock } as never)
    await expect(upsertSquad([scrapedPlayer], '2025-2026')).rejects.toThrow('db error')
  })
})

describe('fetchSquadNames', () => {
  it('returns id and name pairs', async () => {
    const data = [{ id: 'abc', name: 'Juan García' }, { id: 'def', name: 'Pedro López' }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data }),
      }),
    } as never)

    const result = await fetchSquadNames('2025-2026')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 'abc', name: 'Juan García' })
  })

  it('returns empty array when no data', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null }),
      }),
    } as never)

    const result = await fetchSquadNames('2025-2026')
    expect(result).toEqual([])
  })
})

describe('updateCareerHistory', () => {
  it('calls update with career and espn_id on matching id', async () => {
    const eqMock = vi.fn().mockResolvedValue({})
    const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ update: updateMock } as never)

    const career = [{ club: 'Real Madrid', years: '2020-2022' }]
    await updateCareerHistory('player-id-1', career, 'espn-999')

    expect(updateMock).toHaveBeenCalledWith({ career_history: career, espn_id: 'espn-999' })
    expect(eqMock).toHaveBeenCalledWith('id', 'player-id-1')
  })
})
