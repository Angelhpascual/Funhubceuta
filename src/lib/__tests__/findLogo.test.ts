import { describe, it, expect } from 'vitest'
import { findLogo } from '../findLogo'

const logos: Record<string, string> = {
  'AD Ceuta FC': '/logos/ceuta.png',
  'Albacete BP': '/logos/albacete.png',
  'Real Oviedo': '/logos/oviedo.png',
  'SD Huesca': '/logos/huesca.png',
  'FC Andorra': '/logos/andorra.png',
  'Deportivo Alavés': '/logos/alaves.png',
}

describe('findLogo', () => {
  it('returns null for empty name', () => {
    expect(findLogo(logos, '')).toBeNull()
  })

  it('matches exact normalized name', () => {
    expect(findLogo(logos, 'AD Ceuta FC')).toBe('/logos/ceuta.png')
  })

  it('matches ignoring accents', () => {
    expect(findLogo(logos, 'Deportivo Alaves')).toBe('/logos/alaves.png')
  })

  it('matches ignoring case', () => {
    expect(findLogo(logos, 'ad ceuta fc')).toBe('/logos/ceuta.png')
  })

  it('matches by keyword overlap — Albacete Balompié vs Albacete BP', () => {
    expect(findLogo(logos, 'ALBACETE BALOMPIÉ')).toBe('/logos/albacete.png')
  })

  it('matches by substring', () => {
    expect(findLogo(logos, 'Oviedo')).toBe('/logos/oviedo.png')
  })

  it('matches stripping stopwords (FC, SD, AD)', () => {
    expect(findLogo(logos, 'Andorra')).toBe('/logos/andorra.png')
    expect(findLogo(logos, 'Huesca')).toBe('/logos/huesca.png')
  })

  it('returns null when no match', () => {
    expect(findLogo(logos, 'Villarreal CF')).toBeNull()
  })
})
