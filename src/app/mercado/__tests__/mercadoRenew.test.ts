import { describe, it, expect } from 'vitest'
import type { Transfer } from '@/infrastructure/supabase/TransfersRepository'

function makeTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: '1',
    name: 'Jugador Test',
    position: 'MED',
    type: 'renew',
    clubFrom: null,
    clubTo: null,
    photoUrl: null,
    reliability: 2,
    notes: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Logic mirrored from MercadoClient line 172:
// type === 'renew' ? (t.clubTo ?? 'AD Ceuta FC') : routeClub
function renewLabel(t: Pick<Transfer, 'type' | 'clubTo'>): string {
  return t.type === 'renew' ? (t.clubTo ?? 'AD Ceuta FC') : '—'
}

describe('renovados — etiqueta de fecha/destino', () => {
  it('muestra clubTo cuando está definido (fecha de contrato)', () => {
    const t = makeTransfer({ clubTo: 'Hasta 2028' })
    expect(renewLabel(t)).toBe('Hasta 2028')
  })

  it('muestra AD Ceuta FC como fallback cuando clubTo es null', () => {
    const t = makeTransfer({ clubTo: null })
    expect(renewLabel(t)).toBe('AD Ceuta FC')
  })

  it('muestra temporada cuando se usa ese formato', () => {
    const t = makeTransfer({ clubTo: 'Temporada 26/27' })
    expect(renewLabel(t)).toBe('Temporada 26/27')
  })

  it('no aplica a otros tipos de movimiento', () => {
    const t = makeTransfer({ type: 'in', clubTo: 'AD Ceuta FC' })
    expect(renewLabel(t)).toBe('—')
  })
})

describe('renovados — jugadores actuales del Ceuta', () => {
  const renovados: Transfer[] = [
    makeTransfer({ id: '1', name: 'Pedro López',     position: 'POR', clubTo: 'Hasta 2028' }),
    makeTransfer({ id: '2', name: 'Yann Bodiger',    position: 'MED', clubTo: 'Hasta 2028' }),
    makeTransfer({ id: '3', name: 'José Juan Romero',position: 'ENT', clubTo: 'Temporada 26/27' }),
    makeTransfer({ id: '4', name: 'Guille Vallejo',  position: 'POR', clubTo: 'Temporada 26/27' }),
  ]

  it('todos son tipo renew', () => {
    expect(renovados.every(t => t.type === 'renew')).toBe(true)
  })

  it('Pedro López renueva hasta 2028', () => {
    const t = renovados.find(t => t.name === 'Pedro López')!
    expect(renewLabel(t)).toBe('Hasta 2028')
  })

  it('Yann Bodiger renueva hasta 2028', () => {
    const t = renovados.find(t => t.name === 'Yann Bodiger')!
    expect(renewLabel(t)).toBe('Hasta 2028')
  })

  it('José Juan Romero — el míster sigue con nosotros 👑', () => {
    const t = renovados.find(t => t.name === 'José Juan Romero')!
    expect(t.position).toBe('ENT')
    expect(renewLabel(t)).toBe('Temporada 26/27')
  })
})
