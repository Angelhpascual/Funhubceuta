import { describe, it, expect } from 'vitest'
import { getLocalLogo } from '../teamLogos'

describe('getLocalLogo', () => {
  it('returns local path for exact slug match', () => {
    expect(getLocalLogo('ceuta')).toBe('/logos/ceuta.webp')
    expect(getLocalLogo('albacete')).toBe('/logos/albacete.webp')
  })

  it('resolves known aliases', () => {
    expect(getLocalLogo('AD Ceuta FC')).toBe('/logos/ceuta.webp')
    expect(getLocalLogo('RC Celta Fortuna')).toBe('/logos/celtafortuna.webp')
    expect(getLocalLogo('Real Sociedad II')).toBe('/logos/realsociedad2.webp')
    expect(getLocalLogo('Las Palmas')).toBe('/logos/laspalmas.webp')
    expect(getLocalLogo('FC Andorra')).toBe('/logos/andorra.webp')
  })

  it('resolves by keyword match', () => {
    expect(getLocalLogo('Tenerife CD')).toBe('/logos/tenerife.webp')
    expect(getLocalLogo('Real Valladolid CF')).toBe('/logos/valladolid.webp')
    expect(getLocalLogo('Sporting Gijón')).toBe('/logos/sporting.webp')
  })

  it('returns null for unknown teams', () => {
    expect(getLocalLogo('Atlético Madrid')).toBeNull()
    expect(getLocalLogo('')).toBeNull()
  })

  it('returns null for null/undefined', () => {
    expect(getLocalLogo(null)).toBeNull()
    expect(getLocalLogo(undefined)).toBeNull()
  })
})
