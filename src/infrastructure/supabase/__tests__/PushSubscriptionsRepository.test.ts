import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../adminClient', () => ({ supabaseAdmin: { from: vi.fn() } }))

import { supabaseAdmin } from '../adminClient'
import { getAllSubscriptions, upsertSubscription, deleteSubscription } from '../PushSubscriptionsRepository'

beforeEach(() => { vi.resetAllMocks() })

describe('getAllSubscriptions', () => {
  function mockChain(data: unknown) {
    // Chain: .select().eq('environment', ...) → resolves data
    // With adminOnly: .select().eq('environment', ...).eq('is_admin', true) → resolves data
    const eqFinal = vi.fn().mockResolvedValue({ data })
    const eq = vi.fn().mockReturnValue({ eq: eqFinal, then: eqFinal })
    // Make eq itself also thenable so it resolves when not chained further
    eq.mockReturnValue({ eq: eqFinal })
    const eqResolve = vi.fn().mockImplementation(() => ({ eq: eqFinal }))
    const selectResult = { eq: eqResolve }
    eqResolve.mockReturnValue({ eq: eqFinal, ...{ then: undefined } })
    // Simpler: make every eq in chain resolve data
    const buildChain = (): Record<string, unknown> => {
      const chain: Record<string, unknown> = {}
      chain['eq'] = vi.fn().mockImplementation(() => ({ ...buildChain(), ...{ then: (r: (v: unknown) => unknown) => Promise.resolve({ data }).then(r) } }))
      return chain
    }
    const chain = buildChain()
    vi.mocked(supabaseAdmin.from).mockReturnValue({
      select: vi.fn().mockReturnValue(chain),
    } as never)
    return { eq: chain['eq'] as ReturnType<typeof vi.fn> }
  }

  it('returns subscriptions from DB', async () => {
    const data = [
      { endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz' },
      { endpoint: 'https://push.example.com/2', p256dh: 'def', auth: 'uvw' },
    ]
    mockChain(data)
    const result = await getAllSubscriptions()
    expect(result).toHaveLength(2)
    expect(result[0].endpoint).toBe('https://push.example.com/1')
  })

  it('returns empty array when no data', async () => {
    mockChain(null)
    const result = await getAllSubscriptions()
    expect(result).toEqual([])
  })

  it('filters by production environment by default', async () => {
    const { eq } = mockChain([])
    await getAllSubscriptions()
    expect(eq).toHaveBeenCalledWith('environment', 'production')
  })

  it('filters by custom environment when passed', async () => {
    const { eq } = mockChain([])
    await getAllSubscriptions({ environment: 'development' })
    expect(eq).toHaveBeenCalledWith('environment', 'development')
  })
})

describe('upsertSubscription', () => {
  it('upserts with correct conflict key', async () => {
    const upsertMock = vi.fn().mockResolvedValue({})
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertSubscription({ endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz' })

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example.com/1' }),
      { onConflict: 'endpoint' }
    )
  })

  it('defaults environment to production', async () => {
    const upsertMock = vi.fn().mockResolvedValue({})
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertSubscription({ endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz' })

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'production' }),
      expect.anything()
    )
  })

  it('stores development environment when passed', async () => {
    const upsertMock = vi.fn().mockResolvedValue({})
    vi.mocked(supabaseAdmin.from).mockReturnValue({ upsert: upsertMock } as never)

    await upsertSubscription({ endpoint: 'https://push.example.com/1', p256dh: 'abc', auth: 'xyz', environment: 'development' })

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'development' }),
      expect.anything()
    )
  })
})

describe('deleteSubscription', () => {
  it('deletes subscription by endpoint', async () => {
    const eqMock = vi.fn().mockResolvedValue({})
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
    vi.mocked(supabaseAdmin.from).mockReturnValue({ delete: deleteMock } as never)

    await deleteSubscription('https://push.example.com/expired')

    expect(deleteMock).toHaveBeenCalled()
    expect(eqMock).toHaveBeenCalledWith('endpoint', 'https://push.example.com/expired')
  })
})
