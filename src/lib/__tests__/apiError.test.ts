import { describe, it, expect } from 'vitest'
import { apiError } from '../apiError'

describe('apiError', () => {
  it('returns 500 by default', async () => {
    const res = apiError(new Error('something broke'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('something broke')
  })

  it('uses custom status code', async () => {
    const res = apiError('not found', 404)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('not found')
  })

  it('handles non-Error thrown values', async () => {
    const res = apiError('plain string error')
    const body = await res.json()
    expect(body.error).toBe('plain string error')
  })
})
