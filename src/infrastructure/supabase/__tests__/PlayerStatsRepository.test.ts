import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import { upsertPlayerStats, fetchLeadersBySeason, PlayerStatRow } from '../PlayerStatsRepository'

beforeEach(() => { vi.resetAllMocks() })

function makeRow(overrides: Partial<PlayerStatRow> = {}): PlayerStatRow {
  return {
    espn_id: '12345', season: '2025-2026', name: 'Test Player', short_name: 'T. Player',
    position: 'Forward', position_group: 'Delanteros', photo_url: null,
    appearances: 20, goals: 5, assists: 3, shots: 40, shots_on_target: 15,
    yellow_cards: 2, red_cards: 0, saves: 0, goals_conceded: 0,
    updated_at: '2026-01-01T00:00:00Z', ...overrides,
  }
}

function mockTables(playerStats: unknown[], squad: unknown[]) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    const rows = table === 'player_stats' ? playerStats : squad
    return { select: () => ({ eq: () => Promise.resolve({ data: rows }) }) } as never
  })
}

describe('fetchLeadersBySeason', () => {
  it('prefers the squad photo over player_stats\' ESPN headshot when both are present (regression: ESPN\'s photo used to win, so the leaderboard kept showing it even after the squad photo changed)', async () => {
    mockTables(
      [{ name: 'Jordi Escobar', photo_url: 'https://espn.com/old.png', appearances: 10, goals: 5, assists: 0, shots: 0, shots_on_target: 0, saves: 0, yellow_cards: 0, red_cards: 0 }],
      [{ name: 'Jordi Escobar', photo_url: 'https://adceutafc.com/official.webp' }]
    )

    const leaders = await fetchLeadersBySeason('2026-2027')

    expect(leaders?.goals?.leaders[0].photo).toBe('https://adceutafc.com/official.webp')
  })

  it('falls back to the ESPN photo when no squad player matches by name', async () => {
    mockTables(
      [{ name: 'Jordi Escobar', photo_url: 'https://espn.com/old.png', appearances: 10, goals: 5, assists: 0, shots: 0, shots_on_target: 0, saves: 0, yellow_cards: 0, red_cards: 0 }],
      [{ name: 'Someone Else', photo_url: 'https://adceutafc.com/other.webp' }]
    )

    const leaders = await fetchLeadersBySeason('2026-2027')

    expect(leaders?.goals?.leaders[0].photo).toBe('https://espn.com/old.png')
  })
})

describe('upsertPlayerStats', () => {
  it('does nothing for empty array', async () => {
    await upsertPlayerStats([])
    expect(supabaseAdmin.from).not.toHaveBeenCalled()
  })

  it('upserts rows with correct conflict key', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertPlayerStats([makeRow()])

    expect(upsertMock).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ espn_id: '12345', goals: 5 })]),
      { onConflict: 'espn_id,season' }
    )
  })

  it('throws when supabase returns error', async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: { message: 'pk violation' } })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await expect(upsertPlayerStats([makeRow()])).rejects.toThrow('pk violation')
  })
})
