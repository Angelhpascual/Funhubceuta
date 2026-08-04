interface Team { name: string; logo: string | null }

interface Props {
  teams: Team[]
  selectedLogo: string | null
  onSelect: (logo: string | null) => void
}

export function LogoPicker({ teams, selectedLogo, onSelect }: Props) {
  return (
    <div className="mt-2 grid grid-cols-5 gap-2 max-h-40 overflow-y-auto p-2 rounded-[10px] bg-ceuta-bg-soft border border-ceuta-border">
      <button
        type="button"
        className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${!selectedLogo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
        onClick={() => onSelect(null)}
      >
        <div className="w-8 h-8 rounded-full bg-ceuta-bg-mid flex items-center justify-center text-[8px] font-black text-ceuta-muted">?</div>
        <span className="text-[8px] text-ceuta-muted">Sin escudo</span>
      </button>
      {teams.filter(t => t.logo).map(t => (
        <button
          key={t.name}
          type="button"
          className={`flex flex-col items-center gap-1 p-1.5 rounded-[8px] border ${selectedLogo === t.logo ? 'border-ceuta-red bg-red-50' : 'border-transparent'}`}
          onClick={() => onSelect(t.logo)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.logo!} alt={t.name} width={32} height={32} className="object-contain" />
          <span className="text-[8px] text-ceuta-muted text-center leading-tight">{t.name.split(' ').slice(-1)[0]}</span>
        </button>
      ))}
    </div>
  )
}
