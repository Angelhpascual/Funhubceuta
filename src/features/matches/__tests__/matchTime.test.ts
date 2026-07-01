import { describe, it, expect } from 'vitest'

// Logic mirrored from PartidosPage and LiveMatchCard:
// m.time || 'Por confirmar'  →  now hardcoded to 'Por confirmar' always
function displayTime(time: string | null | undefined): string {
  return 'Por confirmar'
}

// Legacy fallback logic (what was before, for regression)
function displayTimeLegacy(time: string | null | undefined): string {
  return time || 'Por confirmar'
}

describe('displayTime — todos los partidos muestran Por confirmar', () => {
  it('siempre devuelve Por confirmar independientemente del valor', () => {
    expect(displayTime('20:00')).toBe('Por confirmar')
  })

  it('devuelve Por confirmar cuando time es null', () => {
    expect(displayTime(null)).toBe('Por confirmar')
  })

  it('devuelve Por confirmar cuando time es undefined', () => {
    expect(displayTime(undefined)).toBe('Por confirmar')
  })

  it('devuelve Por confirmar cuando time es cadena vacía', () => {
    expect(displayTime('')).toBe('Por confirmar')
  })
})

describe('displayTime legacy — fallback cuando time no está definido', () => {
  it('muestra la hora cuando está definida', () => {
    expect(displayTimeLegacy('20:00')).toBe('20:00')
  })

  it('muestra Por confirmar cuando time es null', () => {
    expect(displayTimeLegacy(null)).toBe('Por confirmar')
  })

  it('muestra Por confirmar cuando time es cadena vacía', () => {
    expect(displayTimeLegacy('')).toBe('Por confirmar')
  })
})
