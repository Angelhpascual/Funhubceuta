import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('@/infrastructure/supabase/TransfersRepository', () => ({
  getTransfers: vi.fn(),
  createTransfer: vi.fn(),
  updateTransfer: vi.fn(),
  deleteTransfer: vi.fn(),
}))

import { revalidatePath } from 'next/cache'
import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { getTransfers, createTransfer, updateTransfer, deleteTransfer } from '@/infrastructure/supabase/TransfersRepository'
import { GET, POST, PATCH, DELETE } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/admin/transfers', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe('GET /api/admin/transfers', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns transfers list', async () => {
    const transfers = [{ id: '1', name: 'Jugador', position: 'DEL', type: 'in' as const, clubFrom: null, clubTo: null, reliability: 2 as const, photoUrl: null, notes: null, createdAt: '2026-01-01' }]
    vi.mocked(getTransfers).mockResolvedValue(transfers)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transfers).toHaveLength(1)
  })
})

describe('POST /api/admin/transfers', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const res = await POST(makeRequest('POST', { player: 'Nuevo' }))
    expect(res.status).toBe(401)
  })

  it('creates transfer, revalidates /mercado and returns it', async () => {
    const created = { id: 'new-1', name: 'Nuevo', position: 'DEL', type: 'in' as const, clubFrom: null, clubTo: null, reliability: 2 as const, photoUrl: null, notes: null, createdAt: '2026-01-01' }
    vi.mocked(createTransfer).mockResolvedValue(created)
    const res = await POST(makeRequest('POST', { player: 'Nuevo', type: 'in' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transfer.id).toBe('new-1')
    expect(revalidatePath).toHaveBeenCalledWith('/mercado')
  })

  it('returns 500 when creation fails', async () => {
    vi.mocked(createTransfer).mockResolvedValue(null)
    const res = await POST(makeRequest('POST', { player: 'X' }))
    expect(res.status).toBe(500)
  })
})

describe('PATCH /api/admin/transfers', () => {
  it('returns 400 when id is missing', async () => {
    const res = await PATCH(makeRequest('PATCH', { player: 'Updated' }))
    expect(res.status).toBe(400)
  })

  it('updates transfer, revalidates /mercado and returns ok:true', async () => {
    vi.mocked(updateTransfer).mockResolvedValue(undefined)
    const res = await PATCH(makeRequest('PATCH', { id: '1', player: 'Updated' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(updateTransfer).toHaveBeenCalledWith('1', { player: 'Updated' })
    expect(revalidatePath).toHaveBeenCalledWith('/mercado')
  })
})

describe('DELETE /api/admin/transfers', () => {
  it('returns 400 when id is missing', async () => {
    const res = await DELETE(makeRequest('DELETE', {}))
    expect(res.status).toBe(400)
  })

  it('deletes transfer, revalidates /mercado and returns ok:true', async () => {
    vi.mocked(deleteTransfer).mockResolvedValue(undefined)
    const res = await DELETE(makeRequest('DELETE', { id: '1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(deleteTransfer).toHaveBeenCalledWith('1')
    expect(revalidatePath).toHaveBeenCalledWith('/mercado')
  })
})
