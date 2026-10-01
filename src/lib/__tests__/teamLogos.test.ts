import { describe, it, expect } from 'vitest'
import { getLocalLogo } from '../../data/teamLogos'

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
    expect(getLocalLogo('CD Badajoz')).toBe('/logos/badajoz.webp')
  })

  it('falls back for players\' career-history clubs missing a logo from ESPN (regression)', () => {
    // These clubs come back with logo: null from ESPN's career scrape — the
    // local fallback is what actually shows a crest in the player page.
    expect(getLocalLogo('Villanovense')).toBe('/logos/villanovense.webp')
    expect(getLocalLogo('Cacereno')).toBe('/logos/cacereno.webp')
    expect(getLocalLogo('Marbella FC')).toBe('/logos/marbella.webp')
    expect(getLocalLogo('Juventud Torremolinos')).toBe('/logos/juventud-torremolinos.webp')
    expect(getLocalLogo('Badajoz')).toBe('/logos/badajoz.webp')
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
