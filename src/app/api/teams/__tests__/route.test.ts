import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/TeamsSupabaseRepository', () => {
  const getAllTeams = vi.fn()
  return {
    TeamsSupabaseRepository: class {
      getAllTeams = getAllTeams
      static __getAllTeams = getAllTeams
    },
  }
})

import { TeamsSupabaseRepository } from '@/infrastructure/supabase/TeamsSupabaseRepository'
import { GET } from '../route'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGetAllTeams: ReturnType<typeof vi.fn> = (TeamsSupabaseRepository as any).__getAllTeams

beforeEach(() => { vi.resetAllMocks() })

describe('GET /api/teams', () => {
  it('returns list of teams', async () => {
    const teams = [{ name: 'AD Ceuta', logoUrl: 'https://espn.com/logo.png', season: '2025-2026' }]
    mockGetAllTeams.mockResolvedValue(teams)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.teams).toHaveLength(1)
    expect(body.teams[0].name).toBe('AD Ceuta')
  })

  it('returns empty list when no teams', async () => {
    mockGetAllTeams.mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body.teams).toEqual([])
  })
})
