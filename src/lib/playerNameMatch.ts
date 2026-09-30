import { stripAccents } from './stripAccents'

// LaLiga's plantilla page and ESPN's roster each render a player's name with
// their own abbreviation/accent conventions (e.g. "Joaquín González" vs
// "Joaquin G.", "Alejandro Meléndez" vs "A. Melendez", "Adrián Lapeña Ruíz"
// vs "Lapeña"). Comparing full strings or just the last word misses matches
// like these — instead we compare by any shared word token (≥3 letters,
// accents stripped), which tolerates abbreviation, accents and extra
// surnames on either side.
export function nameTokens(name: string): string[] {
  return stripAccents(name)
    .toLowerCase()
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3)
}

export function namesLikelyMatch(a: string, b: string): boolean {
  const ta = nameTokens(a)
  const tb = nameTokens(b)
  return ta.some((t) => tb.includes(t))
}
