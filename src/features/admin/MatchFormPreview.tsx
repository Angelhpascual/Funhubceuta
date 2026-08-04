const CEUTA = { name: 'AD Ceuta', logo: '/escudo.webp' }

interface Props {
  ceutaHome: boolean
  rivalName: string
  rivalLogo: string | null
}

export function MatchFormPreview({ ceutaHome, rivalName, rivalLogo }: Props) {
  const rivalInitials = rivalName ? rivalName.slice(0, 3).toUpperCase() : '?'
  const RivalLogo = rivalLogo
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={rivalLogo} alt="" width={32} height={32} className="object-contain" />
    : (
      <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[9px] font-black text-ceuta-muted">
        {rivalInitials}
      </div>
    )

  return (
    <div className="flex items-center justify-center gap-3 py-3 rounded-[12px] bg-ceuta-bg-soft border border-ceuta-border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {ceutaHome ? <img src={CEUTA.logo} alt="AD Ceuta" width={32} height={32} className="object-contain" /> : RivalLogo}
      <div className="text-center">
        <div className="text-[10px] font-bold text-ceuta-black">{ceutaHome ? 'AD Ceuta' : (rivalName || 'Rival')}</div>
        <div className="text-[9px] text-ceuta-muted font-bold uppercase tracking-widest">vs</div>
        <div className="text-[10px] font-bold text-ceuta-black">{ceutaHome ? (rivalName || 'Rival') : 'AD Ceuta'}</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {ceutaHome ? RivalLogo : <img src={CEUTA.logo} alt="AD Ceuta" width={32} height={32} className="object-contain" />}
    </div>
  )
}
