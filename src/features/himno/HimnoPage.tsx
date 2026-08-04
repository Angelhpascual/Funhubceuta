interface Props {
  onBack: () => void
}

const VERSES = [
  {
    lines: [
      'En un pueblo marinero, y un escudo por bandera',
      'Su afición con sus guerreros, y una sangre blanca y negra',
      'Los cañones disparando, porque suenan ya los cantes',
      'Las murallas nos protegen, el Murube se hace grande',
      'Animando a nuestro equipo se despierta la pasión',
      'Nuestras almas ya se funden en un solo corazón',
    ],
  },
  {
    chorus: true,
    lines: [
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
      'Perla del mediterráneo, fe, coraje y tradición',
      'Ceuta entera te acompaña, eres puro corazón',
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
    ],
  },
  {
    lines: [
      'La ilusión de nuestro equipo, pinta el cielo de colores',
      'Tus caballas están contigo, mi patrona huele a flores',
      'Oe mi Ceuta oe oe',
      'Oe mi Ceuta oe oe',
      'La ilusión de nuestro equipo, pinta el cielo de colores',
      'Tus caballas están contigo, mi patrona huele a flores',
    ],
  },
  {
    chorus: true,
    lines: [
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
      'Perla del mediterráneo, fe, coraje y tradición',
      'Ceuta entera te acompaña, eres puro corazón',
    ],
  },
  {
    lines: [
      'Late con fuerza en nuestro pecho',
      'Calma las aguas de nuestro estrecho',
      'Siempre contigo, con nuestra historia',
      'Todos unidos, hasta la gloria',
      'Oe mi Ceuta oe oe',
      'Oe mi Ceuta oe oe…',
    ],
  },
]

export function HimnoPage({ onBack }: Props) {
  return (
    <div className="page">

      {/* ── HERO ── */}
      <div className="page-hero-full relative mt-2 overflow-hidden bg-ceuta-black px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        {/* Back button */}
        <button
          onClick={onBack}
          className="relative mb-4 flex size-9 items-center justify-center rounded-full bg-white/10 transition-colors active:bg-white/20"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="relative">
          <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ceuta-red">
            <div className="h-0.5 w-[18px] bg-ceuta-red" />
            AD Ceuta FC
          </div>
          <h1 className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
            HIMNO <em className="not-italic text-ceuta-gold">OFICIAL</em>
          </h1>
          <p className="mt-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white/40">
            Letra y música · Fran Amado &amp; Sarayma
          </p>
        </div>
      </div>

      {/* ── LETRA ── */}
      <div className="flex flex-col gap-0 px-4 pb-10 pt-6">
        {VERSES.map((verse, vi) => (
          <div key={vi} className="mb-8">

            {verse.chorus ? (
              /* ── ESTRIBILLO ── */
              <div className="rounded-[14px] bg-ceuta-black px-5 py-5">
                <p className="mb-3 font-display text-[9px] font-black uppercase tracking-[0.2em] text-ceuta-red">
                  ★ Estribillo
                </p>
                <div className="flex flex-col gap-2">
                  {verse.lines.map((line, li) => (
                    <p
                      key={li}
                      className="font-display text-[18px] font-black uppercase leading-[1.2] tracking-[0.01em] text-white"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              /* ── ESTROFA ── */
              <div className="border-l-2 border-ceuta-border pl-4">
                <div className="flex flex-col gap-[10px]">
                  {verse.lines.map((line, li) => (
                    <p
                      key={li}
                      className="font-body text-[17px] leading-[1.6] text-[var(--black)]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Firma */}
        <div className="mt-2 flex items-center gap-3 border-t border-ceuta-border pt-6">
          <div className="h-px flex-1 bg-ceuta-border" />
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em] text-ceuta-muted">
            Himno oficial AD Ceuta FC
          </span>
          <div className="h-px flex-1 bg-ceuta-border" />
        </div>
      </div>

    </div>
  )
}
