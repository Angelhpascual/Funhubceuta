import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('web-push', () => ({
  default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() },
}))
vi.mock('@/infrastructure/supabase/adminClient', () => {
  const select = vi.fn()
  const eq = vi.fn()
  const from = vi.fn(() => ({ select, eq }))
  return { supabaseAdmin: { from, __from: from, __select: select, __eq: eq } }
})

import { supabaseAdmin } from '@/infrastructure/supabase/adminClient'
import webpush from 'web-push'
import { notifyAdmin } from '../notifyAdmin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSelect: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__select
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockEq: ReturnType<typeof vi.fn> = (supabaseAdmin as any).__eq

beforeEach(() => { vi.resetAllMocks() })

const adminSub = { endpoint: 'https://push.example.com/admin', p256dh: 'k', auth: 'a' }

describe('notifyAdmin', () => {
  it('does nothing when no admin subscriptions', async () => {
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [] })
    await notifyAdmin('Título', 'Cuerpo')
    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it('sends push to admin subscribers', async () => {
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [adminSub] })
    vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201 } as never)
    await notifyAdmin('📬 Noticia', 'Ceuta gana')
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      { endpoint: adminSub.endpoint, keys: { p256dh: adminSub.p256dh, auth: adminSub.auth } },
      expect.stringContaining('Ceuta gana')
    )
  })

  it('does not throw if sendNotification fails', async () => {
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockResolvedValue({ data: [adminSub] })
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('push failed'))
    await expect(notifyAdmin('Test', 'Body')).resolves.not.toThrow()
  })
})
