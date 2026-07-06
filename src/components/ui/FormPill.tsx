const FORM_MAP: Record<string, { label: string; bg: string; color: string; border?: string }> = {
  W: { label: 'V', bg: 'var(--win)',  color: 'var(--black)', border: '1.5px solid var(--black)' },
  D: { label: 'E', bg: 'var(--draw)', color: 'var(--white)' },
  L: { label: 'D', bg: 'var(--loss)', color: 'var(--white)' },
}

export function FormPill({ result }: { result: string }) {
  const f = FORM_MAP[result]
  return (
    <div
      className="flex size-[22px] items-center justify-center rounded-[4px] font-display text-[10px] font-black"
      style={{ backgroundColor: f?.bg ?? 'var(--muted)', color: f?.color ?? 'var(--white)', border: f?.border }}
    >
      {f?.label ?? result}
    </div>
  )
}
