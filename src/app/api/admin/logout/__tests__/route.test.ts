import { describe, it, expect } from 'vitest'
import { POST } from '../route'

describe('POST /api/admin/logout', () => {
  it('returns ok:true', async () => {
    const res = await POST()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it('clears admin_session cookie', async () => {
    const res = await POST()
    const cookie = res.headers.get('Set-Cookie') ?? ''
    expect(cookie).toContain('admin_session=')
    expect(cookie).toContain('Max-Age=0')
  })
})
