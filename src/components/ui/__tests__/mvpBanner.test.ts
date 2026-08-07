import { describe, it, expect } from 'vitest'

// Logic mirrored from MvpBanner.tsx — the component is 'use client' and reads
// localStorage/DOM directly, so we test the pure decision logic in isolation
// (same pattern as installModal.test.ts).

type SessionStatus = 'pending' | 'open' | 'closed'
type BannerState = 'none' | 'antes' | 'abierta' | 'votado' | 'cerrada'

function computeState(
  session: { id: string; status: SessionStatus } | null,
  votedSessionId: string | null
): BannerState {
  if (!session) return 'none'
  if (session.status === 'pending') return 'antes'
  if (session.status === 'closed') return 'cerrada'
  return votedSessionId === session.id ? 'votado' : 'abierta'
}

function pctOf(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

function rankLabel(rank: number): string {
  return rank === 0 ? 'va líder' : `${rank + 1}º lugar`
}

describe('computeState', () => {
  it('returns "none" when there is no active session', () => {
    expect(computeState(null, null)).toBe('none')
  })

  it('returns "antes" when the session is pending', () => {
    expect(computeState({ id: 's1', status: 'pending' }, null)).toBe('antes')
  })

  it('returns "cerrada" when the session is closed, regardless of vote state', () => {
    expect(computeState({ id: 's1', status: 'closed' }, 's1')).toBe('cerrada')
    expect(computeState({ id: 's1', status: 'closed' }, null)).toBe('cerrada')
  })

  it('returns "abierta" when open and the fan has not voted this session', () => {
    expect(computeState({ id: 's1', status: 'open' }, null)).toBe('abierta')
    expect(computeState({ id: 's1', status: 'open' }, 's0')).toBe('abierta')
  })

  it('returns "votado" when open and the stored voted-session id matches', () => {
    expect(computeState({ id: 's1', status: 'open' }, 's1')).toBe('votado')
  })
})

describe('pctOf', () => {
  it('rounds to nearest percent', () => {
    expect(pctOf(1, 3)).toBe(33)
    expect(pctOf(2, 3)).toBe(67)
  })

  it('returns 0 when total is 0 (no votes cast yet)', () => {
    expect(pctOf(0, 0)).toBe(0)
  })

  it('returns 100 when count equals total', () => {
    expect(pctOf(5, 5)).toBe(100)
  })
})

describe('rankLabel', () => {
  it('labels rank 0 as leader', () => {
    expect(rankLabel(0)).toBe('va líder')
  })

  it('labels other ranks by position', () => {
    expect(rankLabel(1)).toBe('2º lugar')
    expect(rankLabel(2)).toBe('3º lugar')
  })
})

// Regression: banner CTA said "Cambiar voto" but only opened the sheet in
// read-only mode, requiring a second internal tap to actually change the
// vote — looked broken. MvpSheet now accepts startInChangeMode to jump
// straight into candidate selection, pre-filled with the current vote.
describe('MvpSheet initial state from startInChangeMode', () => {
  function initialSheetState(startInChangeMode: boolean, votedId: string | null) {
    return {
      pickedId: startInChangeMode ? votedId : null,
      changingVote: !!startInChangeMode,
    }
  }

  it('opens in read-only mode by default', () => {
    expect(initialSheetState(false, 'c1')).toEqual({ pickedId: null, changingVote: false })
  })

  it('opens directly into change mode, pre-selecting the current vote', () => {
    expect(initialSheetState(true, 'c1')).toEqual({ pickedId: 'c1', changingVote: true })
  })
})
