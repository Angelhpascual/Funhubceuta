import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/supabase/AppConfigRepository', () => ({
  getConfig: vi.fn(),
  setConfig: vi.fn(),
}))
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))

import { getConfig, setConfig } from '@/infrastructure/supabase/AppConfigRepository'
import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { GET, POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

describe('GET /api/admin/merchan-toggle', () => {
  it('returns mercadoActive true when config is "true"', async () => {
    vi.mocked(getConfig).mockResolvedValue('true')
    const res = await GET(new Request('http://localhost/api/admin/merchan-toggle'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.mercadoActive).toBe(true)
  })

  it('returns mercadoActive false when config is not "true"', async () => {
    vi.mocked(getConfig).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/admin/merchan-toggle'))
    const body = await res.json()
    expect(body.mercadoActive).toBe(false)
  })
})

describe('POST /api/admin/merchan-toggle', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(new Request('http://localhost', {
      method: 'POST', body: JSON.stringify({ mercadoActive: true }),
    }))
    expect(res.status).toBe(401)
    expect(setConfig).not.toHaveBeenCalled()
  })

  it('sets config to "true" and returns mercadoActive true', async () => {
    vi.mocked(setConfig).mockResolvedValue(undefined)
    const res = await POST(new Request('http://localhost', {
      method: 'POST', body: JSON.stringify({ mercadoActive: true }),
    }))
    expect(res.status).toBe(200)
    expect(setConfig).toHaveBeenCalledWith('mercado_active', 'true')
    const body = await res.json()
    expect(body.mercadoActive).toBe(true)
  })

  it('sets config to "false" when mercadoActive is false', async () => {
    vi.mocked(setConfig).mockResolvedValue(undefined)
    await POST(new Request('http://localhost', {
      method: 'POST', body: JSON.stringify({ mercadoActive: false }),
    }))
    expect(setConfig).toHaveBeenCalledWith('mercado_active', 'false')
  })
})
