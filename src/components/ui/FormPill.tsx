const FORM_MAP: Record<string, { label: string; bg: string }> = {
  W: { label: 'V', bg: 'var(--win)' },
  D: { label: 'E', bg: 'var(--draw)' },
  L: { label: 'D', bg: 'var(--loss)' },
}

export function FormPill({ result }: { result: string }) {
  const f = FORM_MAP[result]
  return (
    <div
      className="flex size-[22px] items-center justify-center rounded-[4px] font-display text-[10px] font-black text-white"
      style={{ backgroundColor: f?.bg ?? 'var(--draw)' }}
    >
      {f?.label ?? result}
    </div>
  )
}
