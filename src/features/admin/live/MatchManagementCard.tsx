'use client'

interface Props {
  mockLoading: string | null
  disallowedSending: 'ceuta' | 'rival' | null
  onPrepareNext: () => void
  onClearMock: () => void
  onSendDisallowed: (team: 'ceuta' | 'rival') => void
}

export function MatchManagementCard({
  mockLoading, disallowedSending, onPrepareNext, onClearMock, onSendDisallowed,
}: Props) {
  return (
    <div className="mt-4 rounded-[12px] border border-ceuta-border bg-white p-4 space-y-3">
      <div className="font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ceuta-muted">
        Gestión del partido
      </div>
      <div className="flex gap-2">
        <button type="button"
          onClick={onPrepareNext}
          disabled={mockLoading !== null}
          className="flex-1 rounded-[10px] bg-ceuta-black py-2.5 font-display text-[11px] font-black uppercase tracking-[0.08em] text-white disabled:opacity-40"
        >
          {mockLoading === 'pre' ? '...' : 'Preparar siguiente partido'}
        </button>
        <button type="button"
          onClick={onClearMock}
          disabled={mockLoading !== null}
          className="rounded-[10px] border border-ceuta-red/30 bg-ceuta-red/5 px-4 py-2.5 font-display text-[11px] font-black uppercase tracking-[0.08em] text-ceuta-red disabled:opacity-40"
        >
          {mockLoading === 'clear' ? '...' : 'Limpiar'}
        </button>
      </div>
      <p className="text-[11px] text-ceuta-muted leading-tight">
        «Preparar siguiente partido» carga el próximo partido de la base de datos en estado previo. «Limpiar» borra todos los datos del mock.
      </p>

      <div className="border-t border-ceuta-border pt-3">
        <div className="mb-1.5 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-ceuta-muted">
          🚩 Gol anulado (ESPN no lo reporta — avisar a mano)
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => onSendDisallowed('ceuta')}
            disabled={disallowedSending !== null}
            className="flex-1 rounded-[10px] border border-ceuta-border bg-white py-2 font-display text-[11px] font-black uppercase tracking-[0.06em] text-ceuta-black disabled:opacity-40"
          >
            {disallowedSending === 'ceuta' ? 'Enviando...' : 'Anulado al Ceuta'}
          </button>
          <button type="button"
            onClick={() => onSendDisallowed('rival')}
            disabled={disallowedSending !== null}
            className="flex-1 rounded-[10px] border border-ceuta-border bg-white py-2 font-display text-[11px] font-black uppercase tracking-[0.06em] text-ceuta-black disabled:opacity-40"
          >
            {disallowedSending === 'rival' ? 'Enviando...' : 'Anulado al rival'}
          </button>
        </div>
      </div>
    </div>
  )
}
