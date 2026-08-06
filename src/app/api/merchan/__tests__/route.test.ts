import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/MerchanRepository', () => ({
  getMerchanProducts: vi.fn(),
}))

import { getMerchanProducts } from '@/infrastructure/supabase/MerchanRepository'
import { GET } from '../route'

beforeEach(() => vi.resetAllMocks())

describe('GET /api/merchan', () => {
  it('returns products array', async () => {
    const products = [
      { id: 1, name: 'Camiseta', price: '66,50 €', url: 'https://tienda.adceutafc.com/p', image: 'https://img.jpg', category: 'equipaciones', tag: null, featured: false },
    ]
    vi.mocked(getMerchanProducts).mockResolvedValue(products as never)

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.products).toEqual(products)
  })

  it('returns 500 on error', async () => {
    vi.mocked(getMerchanProducts).mockRejectedValue(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
