import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))
vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabaseAdmin } from '../adminClient'
import { upsertPlayerStats, PlayerStatRow } from '../PlayerStatsRepository'

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
