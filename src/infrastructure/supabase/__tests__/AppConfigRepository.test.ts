import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../client', () => {
  const from = vi.fn()
  return { supabase: { from, __from: from } }
})

import { supabase } from '../client'
import { getConfig, setConfig, deleteConfig } from '../AppConfigRepository'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFrom: ReturnType<typeof vi.fn> = (supabase as any).__from

beforeEach(() => { vi.resetAllMocks() })

describe('AppConfigRepository', () => {
  describe('getConfig', () => {
    it('returns value when key exists', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { value: 'W,W,L' }, error: null }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await getConfig('ceuta_form')).toBe('W,W,L')
    })

    it('returns null when key not found', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockFrom.mockReturnValue(chain)
      expect(await getConfig('missing_key')).toBeNull()
    })
  })

  describe('setConfig', () => {
    it('upserts key-value with onConflict key', async () => {
      const chain = { upsert: vi.fn().mockResolvedValue({}) }
      mockFrom.mockReturnValue(chain)
      await setConfig('ceuta_form', 'W,D,L')
      expect(mockFrom).toHaveBeenCalledWith('app_config')
      expect(chain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'ceuta_form', value: 'W,D,L' }),
        { onConflict: 'key' }
      )
    })
  })

  describe('deleteConfig', () => {
    it('deletes the given key', async () => {
      const chain = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({}) }
      mockFrom.mockReturnValue(chain)
      await deleteConfig('old_key')
      expect(mockFrom).toHaveBeenCalledWith('app_config')
      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('key', 'old_key')
    })
  })
})
