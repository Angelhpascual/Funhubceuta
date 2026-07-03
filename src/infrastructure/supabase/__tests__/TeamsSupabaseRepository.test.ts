import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => {
  const from = vi.fn()
  return { supabase: { from, __from: from } }
})
vi.mock('@/lib/constants', () => ({ CURRENT_SEASON: '2025-2026' }))

import { supabase } from '../client'
import { TeamsSupabaseRepository } from '../TeamsSupabaseRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from

beforeEach(() => { vi.resetAllMocks() })

describe('TeamsSupabaseRepository', () => {
  const repo = new TeamsSupabaseRepository()

  describe('upsertTeams', () => {
    it('does nothing when teams array is empty', async () => {
      await repo.upsertTeams([])
      expect(mockFrom).not.toHaveBeenCalled()
    })

    it('upserts teams with onConflict name,season', async () => {
      const chain = { upsert: vi.fn().mockResolvedValue({ error: null }) }
      mockFrom.mockReturnValue(chain)
      await repo.upsertTeams([{ name: 'AD Ceuta', logoUrl: 'https://espn.com/logo.png', season: '2025-2026' }])
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'AD Ceuta' })]),
        { onConflict: 'name,season' }
      )
    })

    it('throws when upsert fails', async () => {
      const chain = { upsert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }) }
      mockFrom.mockReturnValue(chain)
      await expect(repo.upsertTeams([{ name: 'X', logoUrl: null, season: '2025-2026' }]))
        .rejects.toThrow('Failed to upsert teams')
    })
  })

  describe('getAllTeams', () => {
    it('returns mapped teams for current season', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [{ name: 'AD Ceuta', short_name: 'Ceuta', logo_url: 'https://espn.com/logo.png', season: '2025-2026' }] }),
      }
      mockFrom.mockReturnValue(chain)
      const result = await repo.getAllTeams()
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('AD Ceuta')
      expect(result[0].logoUrl).toBe('https://espn.com/logo.png')
    })

    it('returns empty array when no teams', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await repo.getAllTeams()).toEqual([])
    })
  })

  describe('getLogoByName', () => {
    it('returns logo for exact normalized match', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [{ name: 'AD Ceuta FC', logo_url: 'https://espn.com/logo.png' }] }),
      }
      mockFrom.mockReturnValue(chain)
      const logo = await repo.getLogoByName('Ceuta')
      expect(logo).toBe('https://espn.com/logo.png')
    })

    it('returns null when no match found', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [] }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await repo.getLogoByName('Desconocido')).toBeNull()
    })

    it('returns null when data is null', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await repo.getLogoByName('Ceuta')).toBeNull()
    })
  })
})
