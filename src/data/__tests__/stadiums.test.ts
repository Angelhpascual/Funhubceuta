import { describe, it, expect } from 'vitest'
import { getStadium } from '../stadiums'

describe('getStadium', () => {
  it('returns null for empty input', () => {
    expect(getStadium('')).toBeNull()
  })

  it('matches exactly, ignoring accents', () => {
    expect(getStadium('Almería')).toBe('Power Horse Stadium')
    expect(getStadium('almeria')).toBe('Power Horse Stadium')
  })

  it('matches Ceuta under its full official name', () => {
    expect(getStadium('AD Ceuta FC')).toBe('Alfonso Murube')
  })

  it('matches partially when the name has a different prefix/suffix', () => {
    expect(getStadium('Real Ceuta')).toBe('Alfonso Murube')
  })

  it('returns null when no team matches', () => {
    expect(getStadium('Equipo Inventado XYZ')).toBeNull()
  })
})
