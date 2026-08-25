import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => {
  const from = vi.fn()
  return { supabase: { from, __from: from } }
})
vi.mock('../adminClient', () => {
  const from = vi.fn()
  return { supabaseAdmin: { from, __from: from } }
})

import { supabase } from '../client'
import { supabaseAdmin } from '../adminClient'
import { StandingsSupabaseRepository } from '../StandingsSupabaseRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdminFrom: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__from

beforeEach(() => { vi.resetAllMocks() })

const rawRow = {
  id: 'uuid-1', external_id: '2025-2026-1', season: '2025-2026', position: 1,
  team_name: 'AD Ceuta', team_logo: 'https://espn.com/logo.png',
  played: 30, won: 15, drawn: 8, lost: 7,
  goals_for: 45, goals_against: 30, goal_difference: 15, points: 53,
  form: 'WWDLW', description: 'Promotion', created_at: '2026-01-01', updated_at: '2026-06-01',
}

describe('StandingsSupabaseRepository', () => {
  const repo = new StandingsSupabaseRepository()

  describe('getBySeason', () => {
    it('returns standings with mapped entries', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [rawRow], error: null }),
      }
      mockFrom.mockReturnValue(chain)
      const result = await repo.getBySeason('2025-2026')
      expect(result).not.toBeNull()
      expect(result!.entries).toHaveLength(1)
      expect(result!.entries[0].teamName).toBe('AD Ceuta')
      expect(result!.entries[0].points).toBe(53)
    })

    it('returns null when no data', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await repo.getBySeason('2020-2021')).toBeNull()
    })

    it('returns null on DB error', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await repo.getBySeason('2025-2026')).toBeNull()
    })
  })

  describe('upsertEntries', () => {
    it('upserts entries with onConflict external_id', async () => {
      const chain = { upsert: vi.fn().mockResolvedValue({ error: null }) }
      mockAdminFrom.mockReturnValue(chain)
      await repo.upsertEntries([{
        externalId: '2025-2026-1', season: '2025-2026', position: 1, teamName: 'AD Ceuta',
        teamLogo: null, played: 30, won: 15, drawn: 8, lost: 7,
        goalsFor: 45, goalsAgainst: 30, goalDifference: 15, points: 53, form: null, description: '',
      }])
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ external_id: '2025-2026-1', points: 53 })]),
        { onConflict: 'external_id' }
      )
    })

    it('throws when upsert fails', async () => {
      const chain = { upsert: vi.fn().mockResolvedValue({ error: { message: 'constraint violation' } }) }
      mockAdminFrom.mockReturnValue(chain)
      await expect(repo.upsertEntries([{
        externalId: 'x', season: '2025-2026', position: 1, teamName: 'X',
        teamLogo: null, played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: null, description: '',
      }])).rejects.toThrow('Failed to upsert standings')
    })
  })
})
