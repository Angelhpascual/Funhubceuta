import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/infrastructure/admin/auth', () => ({
  checkAdminAuth: vi.fn(),
  unauthorizedResponse: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
}))
vi.mock('sharp', () => {
  const chain = {
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('webp-data')),
  }
  return { default: vi.fn(() => chain) }
})
vi.mock('@supabase/supabase-js', () => {
  const upload = vi.fn()
  const getPublicUrl = vi.fn()
  const from = vi.fn(() => ({ upload, getPublicUrl }))
  return {
    createClient: () => ({
      storage: { from, __from: from, __upload: upload, __getPublicUrl: getPublicUrl },
    }),
  }
})

import { checkAdminAuth } from '@/infrastructure/admin/auth'
import { POST } from '../route'

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(checkAdminAuth).mockResolvedValue(true)
})

function makeFormData(file: File | null, name?: string) {
  const fd = new FormData()
  if (file) fd.append('file', file)
  if (name) fd.append('name', name)
  return fd
}

describe('POST /api/admin/upload-photo', () => {
  it('returns 401 when not authenticated', async () => {
    vi.mocked(checkAdminAuth).mockResolvedValue(false)
    const req = new Request('http://localhost/api/admin/upload-photo', {
      method: 'POST',
      body: makeFormData(null),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 when no file is provided', async () => {
    const req = new Request('http://localhost/api/admin/upload-photo', {
      method: 'POST',
      body: makeFormData(null),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No file')
  })

  it('uploads and returns public URL', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('', '')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockUpload = (client.storage as any).__upload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockGetPublicUrl = (client.storage as any).__getPublicUrl
    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://supabase.co/public/path.webp' } })

    const file = new File([new Uint8Array([0xff, 0xd8])], 'photo.jpg', { type: 'image/jpeg' })
    const req = new Request('http://localhost/api/admin/upload-photo', {
      method: 'POST',
      body: makeFormData(file, 'Jugador Test'),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.url).toContain('supabase.co')
  })
})
