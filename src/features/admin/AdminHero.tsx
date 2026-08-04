interface Badge {
  color: string
  label: string
  value: React.ReactNode
}

interface AdminHeroProps {
  label: string
  title: React.ReactNode
  badges?: Badge[]
}

export function AdminHero({ label, title, badges = [] }: AdminHeroProps) {
  return (
    <section className="bg-ceuta-black text-white relative overflow-hidden mb-8">
      <div
        className="absolute top-0 right-[-40px] bottom-0 w-[420px] opacity-[0.08]"
        style={{
          background: 'repeating-linear-gradient(-45deg, #fff 0 14px, #000 14px 28px)',
          clipPath: 'polygon(120px 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-9 relative flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="font-display text-[12.5px] font-bold tracking-[0.16em] uppercase text-ceuta-red flex items-center gap-2.5">
            <span className="w-6 h-0.5 bg-ceuta-red" />
            {label}
          </div>
          <h1 className="font-display font-black text-[46px] leading-[0.95] uppercase mt-2">
            {title}
          </h1>
        </div>
        {badges.length > 0 && (
          <div className="flex gap-2.5 flex-wrap">
            {badges.map((b, i) => (
              <span
                key={i}
                className="flex items-center gap-2 bg-white/7 border border-white/14 rounded-full px-3.5 py-2 font-display text-[12.5px] font-semibold tracking-[0.06em] uppercase text-white/75"
              >
                <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: b.color }} />
                {b.label} · <b className="text-white">{b.value}</b>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
