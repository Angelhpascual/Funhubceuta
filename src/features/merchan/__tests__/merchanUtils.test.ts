import { describe, it, expect } from 'vitest'
import { shortenProductName } from '../merchanUtils'

describe('shortenProductName', () => {
  it('strips the club+season suffix in short format (26/27)', () => {
    expect(shortenProductName('Camiseta primera equipación AD Ceuta FC 26/27')).toBe(
      'Camiseta primera equipación'
    )
  })

  it('strips the club+season suffix in full format (2025/26)', () => {
    expect(shortenProductName('Sudadera entrenamiento AD Ceuta FC 2025/26')).toBe(
      'Sudadera entrenamiento'
    )
  })

  it('strips the club+season suffix in full-year format (2026/2027)', () => {
    expect(shortenProductName('Pantalón paseo AD Ceuta FC 2026/2027')).toBe('Pantalón paseo')
  })

  it('leaves a name without the suffix untouched', () => {
    expect(shortenProductName('Bufanda escudo clásico')).toBe('Bufanda escudo clásico')
  })
})
