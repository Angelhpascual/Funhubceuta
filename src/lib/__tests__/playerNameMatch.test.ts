import { describe, it, expect } from 'vitest'
import { nameTokens, namesLikelyMatch } from '../playerNameMatch'

describe('nameTokens', () => {
  it('strips accents, lowercases, and drops short tokens', () => {
    expect(nameTokens('José Miguel')).toEqual(['jose', 'miguel'])
  })

  it('treats abbreviation dots as word separators', () => {
    expect(nameTokens('A. Melendez')).toEqual(['melendez'])
  })
})

describe('namesLikelyMatch', () => {
  it('matches a double-surname ESPN name against the stored short name', () => {
    expect(namesLikelyMatch('Lapeña', 'Adrián Lapeña Ruíz')).toBe(true)
  })

  it('matches across accents', () => {
    expect(namesLikelyMatch('A. Melendez', 'Alejandro Meléndez')).toBe(true)
  })

  it('matches an unaccented squad name to an accented full name via shared first name', () => {
    expect(namesLikelyMatch('Joaquin G.', 'Joaquín González')).toBe(true)
  })

  it('does not match unrelated names', () => {
    expect(namesLikelyMatch('Omar', 'O.sadik')).toBe(false)
  })
})
