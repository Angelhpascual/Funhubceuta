import { describe, it, expect } from 'vitest'

// ── Logic mirrored from PartidosPage ─────────────────────────────────────────

const RESULT_CONFIG = {
  W: { label: 'Victoria', bg: '#1E7F47', color: '#fff', short: 'V' },
  D: { label: 'Empate',   bg: 'var(--gold)', color: '#000', short: 'E' },
  L: { label: 'Derrota',  bg: 'var(--red)', color: '#fff', short: 'D' },
} as const

type Result = 'W' | 'D' | 'L'

function homeScoreClass(result: Result | null, ceutaHome: boolean): string {
  if (!result) return ''
  if (ceutaHome) return result === 'W' ? 'win' : result === 'L' ? 'lose' : ''
  return result === 'L' ? 'win' : result === 'W' ? 'lose' : ''
}

function awayScoreClass(result: Result | null, ceutaHome: boolean): string {
  if (!result) return ''
  if (!ceutaHome) return result === 'W' ? 'win' : result === 'L' ? 'lose' : ''
  return result === 'L' ? 'win' : result === 'W' ? 'lose' : ''
}

function countResults(results: { result: string | null }[], type: Result): number {
  return results.filter(r => r.result === type).length
}

// ── RESULT_CONFIG ─────────────────────────────────────────────────────────────

describe('RESULT_CONFIG', () => {
  it('W maps to Victoria', () => expect(RESULT_CONFIG.W.label).toBe('Victoria'))
  it('D maps to Empate',   () => expect(RESULT_CONFIG.D.label).toBe('Empate'))
  it('L maps to Derrota',  () => expect(RESULT_CONFIG.L.label).toBe('Derrota'))
  it('W short is V',  () => expect(RESULT_CONFIG.W.short).toBe('V'))
  it('D short is E',  () => expect(RESULT_CONFIG.D.short).toBe('E'))
  it('L short is D',  () => expect(RESULT_CONFIG.L.short).toBe('D'))
})

// ── Score highlight logic ─────────────────────────────────────────────────────

describe('homeScoreClass — Ceuta at home', () => {
  it('W → win',  () => expect(homeScoreClass('W', true)).toBe('win'))
  it('L → lose', () => expect(homeScoreClass('L', true)).toBe('lose'))
  it('D → ""',   () => expect(homeScoreClass('D', true)).toBe(''))
})

describe('homeScoreClass — Ceuta away', () => {
  it('L → win (opponent won at home)',  () => expect(homeScoreClass('L', false)).toBe('win'))
  it('W → lose (opponent lost at home)', () => expect(homeScoreClass('W', false)).toBe('lose'))
  it('D → ""', () => expect(homeScoreClass('D', false)).toBe(''))
})

describe('awayScoreClass — Ceuta away', () => {
  it('W → win',  () => expect(awayScoreClass('W', false)).toBe('win'))
  it('L → lose', () => expect(awayScoreClass('L', false)).toBe('lose'))
  it('D → ""',   () => expect(awayScoreClass('D', false)).toBe(''))
})

describe('awayScoreClass — Ceuta at home', () => {
  it('L → win (away team won)',  () => expect(awayScoreClass('L', true)).toBe('win'))
  it('W → lose (away team lost)', () => expect(awayScoreClass('W', true)).toBe('lose'))
  it('D → ""', () => expect(awayScoreClass('D', true)).toBe(''))
})

// ── countResults ──────────────────────────────────────────────────────────────

describe('countResults', () => {
  const results = [
    { result: 'W' }, { result: 'W' }, { result: 'W' },
    { result: 'D' }, { result: 'D' },
    { result: 'L' },
    { result: null },
  ]

  it('counts wins correctly',   () => expect(countResults(results, 'W')).toBe(3))
  it('counts draws correctly',  () => expect(countResults(results, 'D')).toBe(2))
  it('counts losses correctly', () => expect(countResults(results, 'L')).toBe(1))
  it('null results are ignored', () => {
    expect(countResults(results, 'W') + countResults(results, 'D') + countResults(results, 'L')).toBe(6)
  })
})

// ── null result guard ─────────────────────────────────────────────────────────

describe('null result handling', () => {
  it('homeScoreClass returns "" for null result', () => {
    expect(homeScoreClass(null, true)).toBe('')
    expect(homeScoreClass(null, false)).toBe('')
  })

  it('awayScoreClass returns "" for null result', () => {
    expect(awayScoreClass(null, true)).toBe('')
    expect(awayScoreClass(null, false)).toBe('')
  })
})
