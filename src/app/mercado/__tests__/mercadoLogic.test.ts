import { describe, it, expect } from 'vitest'
import type { Transfer } from '@/infrastructure/supabase/TransfersRepository'

// ─── Pure logic extracted from MercadoClient ─────────────────────────────────

function isExitRumor(t: Pick<Transfer, 'clubFrom'>): boolean {
  return t.clubFrom === 'AD Ceuta FC'
}

const REL_TEXT: Record<number, string> = { 3: 'Muy fiable', 2: 'Posible', 1: 'Especulación' }

const ROUTE_LABEL: Record<string, string> = {
  in:    'Procede de',
  out:   'Destino',
  renew: 'Renueva hasta',
  rumor: 'Suena desde',
}

function makeTransfer(overrides: Partial<Transfer> = {}): Transfer {
  return {
    id: '1',
    name: 'Jugador Test',
    position: 'DEL',
    type: 'in',
    clubFrom: 'Club Origen',
    clubTo: null,
    photoUrl: null,
    reliability: 2,
    notes: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── isExitRumor ─────────────────────────────────────────────────────────────

describe('isExitRumor', () => {
  it('returns true when clubFrom is AD Ceuta FC', () => {
    expect(isExitRumor({ clubFrom: 'AD Ceuta FC' })).toBe(true)
  })

  it('returns false when clubFrom is another club', () => {
    expect(isExitRumor({ clubFrom: 'Real Madrid' })).toBe(false)
  })

  it('returns false when clubFrom is null', () => {
    expect(isExitRumor({ clubFrom: null })).toBe(false)
  })
})

// ─── REL_TEXT ────────────────────────────────────────────────────────────────

describe('REL_TEXT', () => {
  it('reliability 3 → Muy fiable', () => {
    expect(REL_TEXT[3]).toBe('Muy fiable')
  })

  it('reliability 2 → Posible', () => {
    expect(REL_TEXT[2]).toBe('Posible')
  })

  it('reliability 1 → Especulación', () => {
    expect(REL_TEXT[1]).toBe('Especulación')
  })
})

// ─── ROUTE_LABEL ─────────────────────────────────────────────────────────────

describe('ROUTE_LABEL', () => {
  it('in → Procede de', () => {
    expect(ROUTE_LABEL['in']).toBe('Procede de')
  })

  it('out → Destino', () => {
    expect(ROUTE_LABEL['out']).toBe('Destino')
  })

  it('renew → Renueva hasta', () => {
    expect(ROUTE_LABEL['renew']).toBe('Renueva hasta')
  })

  it('rumor → Suena desde', () => {
    expect(ROUTE_LABEL['rumor']).toBe('Suena desde')
  })
})

// ─── Transfer counts per tab ──────────────────────────────────────────────────

describe('transfer counts per tab', () => {
  const transfers: Transfer[] = [
    makeTransfer({ id: '1', type: 'in' }),
    makeTransfer({ id: '2', type: 'in' }),
    makeTransfer({ id: '3', type: 'out' }),
    makeTransfer({ id: '4', type: 'renew' }),
    makeTransfer({ id: '5', type: 'rumor' }),
    makeTransfer({ id: '6', type: 'rumor' }),
  ]

  it('counts in transfers correctly', () => {
    expect(transfers.filter(t => t.type === 'in').length).toBe(2)
  })

  it('counts out transfers correctly', () => {
    expect(transfers.filter(t => t.type === 'out').length).toBe(1)
  })

  it('counts renew transfers correctly', () => {
    expect(transfers.filter(t => t.type === 'renew').length).toBe(1)
  })

  it('counts rumor transfers correctly', () => {
    expect(transfers.filter(t => t.type === 'rumor').length).toBe(2)
  })

  it('filters correctly by active tab', () => {
    const filtered = transfers.filter(t => t.type === 'rumor')
    expect(filtered).toHaveLength(2)
    expect(filtered.every(t => t.type === 'rumor')).toBe(true)
  })
})

// ─── Exit rumor routing ───────────────────────────────────────────────────────

describe('exit rumor routing', () => {
  it('a rumor where clubFrom is AD Ceuta FC is an exit rumor', () => {
    const t = makeTransfer({ type: 'rumor', clubFrom: 'AD Ceuta FC', clubTo: 'Algeciras CF' })
    expect(isExitRumor(t)).toBe(true)
  })

  it('exit rumor uses clubTo as destination', () => {
    const t = makeTransfer({ type: 'rumor', clubFrom: 'AD Ceuta FC', clubTo: 'Algeciras CF' })
    const routeClub = isExitRumor(t) ? (t.clubTo ?? 'Por determinar') : (t.clubFrom ?? null)
    expect(routeClub).toBe('Algeciras CF')
  })

  it('exit rumor with no clubTo falls back to Por determinar', () => {
    const t = makeTransfer({ type: 'rumor', clubFrom: 'AD Ceuta FC', clubTo: null })
    const routeClub = isExitRumor(t) ? (t.clubTo ?? 'Por determinar') : (t.clubFrom ?? null)
    expect(routeClub).toBe('Por determinar')
  })

  it('arrival rumor uses clubFrom as source', () => {
    const t = makeTransfer({ type: 'rumor', clubFrom: 'Cádiz CF', clubTo: null })
    const routeClub = isExitRumor(t) ? (t.clubTo ?? 'Por determinar') : (t.clubFrom ?? null)
    expect(routeClub).toBe('Cádiz CF')
  })
})
