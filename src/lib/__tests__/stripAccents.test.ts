import { describe, it, expect } from 'vitest'
import { stripAccents } from '../stripAccents'

describe('stripAccents', () => {
  it('removes Spanish accented vowels', () => {
    expect(stripAccents('Cádiz')).toBe('Cadiz')
    expect(stripAccents('Almería')).toBe('Almeria')
    expect(stripAccents('Córdoba')).toBe('Cordoba')
    expect(stripAccents('Leganés')).toBe('Leganes')
  })

  it('leaves plain ASCII untouched', () => {
    expect(stripAccents('Ceuta')).toBe('Ceuta')
  })

  it('handles ñ (base char + combining tilde under NFD)', () => {
    expect(stripAccents('España')).toBe('Espana')
  })

  it('handles empty string', () => {
    expect(stripAccents('')).toBe('')
  })
})
