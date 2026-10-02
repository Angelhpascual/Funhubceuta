import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => {
  const from = vi.fn()
  return { supabase: { from, __from: from } }
})

import { supabase } from '../client'
import { getMerchanProducts } from '../MerchanRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from

beforeEach(() => { vi.resetAllMocks() })

function mockQuery(result: { data: unknown; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  mockFrom.mockReturnValue({ select })
  return { select, eq, order }
}

describe('getMerchanProducts', () => {
  it('queries only active products ordered by sort_order', async () => {
    const { select, eq, order } = mockQuery({ data: [], error: null })
    await getMerchanProducts()
    expect(mockFrom).toHaveBeenCalledWith('merchan_products')
    expect(select).toHaveBeenCalledWith('id, name, price, url, image, category, tag, featured, sort_order')
    expect(eq).toHaveBeenCalledWith('active', true)
    expect(order).toHaveBeenCalledWith('sort_order', { ascending: true })
  })

  it('returns the products on success', async () => {
    const products = [{ id: 1, name: 'Camiseta' }]
    mockQuery({ data: products, error: null })
    const result = await getMerchanProducts()
    expect(result).toEqual(products)
  })

  it('returns an empty array when data is null', async () => {
    mockQuery({ data: null, error: null })
    const result = await getMerchanProducts()
    expect(result).toEqual([])
  })

  it('throws when supabase returns an error', async () => {
    mockQuery({ data: null, error: new Error('db down') })
    await expect(getMerchanProducts()).rejects.toThrow('db down')
  })
})
