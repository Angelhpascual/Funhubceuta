import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => ({ supabase: { from: vi.fn() } }))

import { supabase } from '../client'
import { getAllSubscriptions, upsertSubscription, deleteSubscription } from '../PushSubscriptionsRepository'

beforeEach(() => { vi.resetAllMocks() })

describe('getAllSubscriptions', () => {
  it('returns subscriptions from DB', async () => {
    const data = [
      { endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz' },
      { endpoint: 'https://push.example.com/2', p256dh: 'def', auth: 'uvw' },
    ]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data }),
    } as never)

    const result = await getAllSubscriptions()
    expect(result).toHaveLength(2)
    expect(result[0].endpoint).toBe('https://push.example.com/1')
  })

  it('returns empty array when no data', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null }),
    } as never)

    const result = await getAllSubscriptions()
    expect(result).toEqual([])
  })
})

describe('upsertSubscription', () => {
  it('upserts with correct conflict key', async () => {
    const upsertMock = vi.fn().mockResolvedValue({})
    vi.mocked(supabase.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertSubscription({ endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz' })

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example.com/1' }),
      { onConflict: 'endpoint' }
    )
  })
})

describe('deleteSubscription', () => {
  it('deletes subscription by endpoint', async () => {
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as never)

    await deleteSubscription('https://push.example.com/expired')

    expect(deleteMock).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('endpoint', 'https://push.example.com/expired')
  })
})
