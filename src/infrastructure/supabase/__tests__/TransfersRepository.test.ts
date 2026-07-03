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
import { getTransfers, createTransfer, updateTransfer, deleteTransfer } from '../TransfersRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAdminFrom: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__from

beforeEach(() => { vi.resetAllMocks() })

const rawRow = {
  id: '1', name: 'Jugador', position: 'Delantero', type: 'in',
  club_from: 'Club A', club_to: null, reliability: 2, photo_url: null,
  notes: 'Rumor', created_at: '2026-01-01T00:00:00Z',
}

const expected = {
  id: '1', name: 'Jugador', position: 'Delantero', type: 'in',
  clubFrom: 'Club A', clubTo: null, reliability: 2, photoUrl: null,
  notes: 'Rumor', createdAt: '2026-01-01T00:00:00Z',
}

describe('getTransfers', () => {
  it('returns mapped transfers', async () => {
    const chain = { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [rawRow], error: null }) }
    mockFrom.mockReturnValue(chain)
    expect(await getTransfers()).toEqual([expected])
  })

  it('returns empty array on error', async () => {
    const chain = { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }) }
    mockFrom.mockReturnValue(chain)
    expect(await getTransfers()).toEqual([])
  })
})

describe('createTransfer', () => {
  it('returns mapped transfer on success', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: rawRow, error: null }),
    }
    mockAdminFrom.mockReturnValue(chain)
    const result = await createTransfer({
      name: 'Jugador', position: 'Delantero', type: 'in',
      clubFrom: 'Club A', clubTo: null, reliability: 2, photoUrl: null, notes: 'Rumor',
    })
    expect(result).toEqual(expected)
  })

  it('returns null on error', async () => {
    const chain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
    }
    mockAdminFrom.mockReturnValue(chain)
    expect(await createTransfer({ name: 'X', position: 'F', type: 'out', clubFrom: null, clubTo: null, reliability: 1, photoUrl: null, notes: null })).toBeNull()
  })
})

describe('deleteTransfer', () => {
  it('calls delete with id', async () => {
    const chain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({}) }
    mockAdminFrom.mockReturnValue(chain)
    await deleteTransfer('1')
    expect(chain.delete).toHaveBeenCalled()
    expect(chain.eq).toHaveBeenCalledWith('id', '1')
  })
})

describe('updateTransfer', () => {
  it('calls update with id', async () => {
    const chain = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({}) }
    mockAdminFrom.mockReturnValue(chain)
    await updateTransfer('1', { name: 'Updated' })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }))
    expect(chain.eq).toHaveBeenCalledWith('id', '1')
  })
})
