// Static server component — no data fetching, renders instantly
export function ClubHero() {
  return (
    <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
      <div
        className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
        style={{
          background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
          clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
        }}
      />
      <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
        <div className="h-0.5 w-[18px] bg-ceuta-red" />
        Temporada 2026–27
      </div>
      <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
        AD CEUTA <em className="not-italic text-ceuta-gold">FC</em>
        <br />
        <span className="text-[28px]">EL CLUB</span>
      </div>
    </div>
  )
}
