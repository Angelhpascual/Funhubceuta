interface Props {
  onBack: () => void
}

const VERSES = [
  {
    lines: [
      'En un pueblo marinero, Y un escudo por bandera',
      'Su afición con sus guerreros, Y una sangre blanca y negra',
      'Los cañones disparando, Porque suenan ya los cantes',
      'Las murallas nos protegen, El Murube se hace grande',
      'Animando a nuestro equipo se despierta la pasión',
      'Nuestras almas ya se funden en un solo corazón',
    ],
  },
  {
    chorus: true,
    lines: [
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
      'Perla del mediterráneo fe, coraje y tradición',
      'Ceuta entera te acompaña, Eres puro corazón',
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
    ],
  },
  {
    lines: [
      'La ilusión de nuestro equipo, Pinta el cielo de colores',
      'Tus caballas están contigo, Mi patrona huele a flores',
      'Oe mi Ceuta oe oe',
      'Oe mi Ceuta oe oe',
      'La ilusión de nuestro equipo, Pinta el cielo de colores',
      'Tus caballas están contigo, Mi patrona huele a flores',
    ],
  },
  {
    chorus: true,
    lines: [
      'Campeón mi Ceuta campeón',
      'Campeón mi Ceuta campeón',
      'Perla del mediterráneo fe, coraje y tradición',
      'Ceuta entera te acompaña, Eres puro corazón',
    ],
  },
  {
    lines: [
      'Late con fuerza en nuestro pecho',
      'Calma las aguas de nuestro estrecho',
      'Siempre contigo, con nuestra historia,',
      'todos unidos, hasta la gloria',
      'Oe mi Ceuta oe oe',
      'Oe mi Ceuta oe oe………',
    ],
  },
]

export function HimnoPage({ onBack }: Props) {
  return (
    <div className="page">
      {/* Header con botón atrás */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '20px 16px 8px',
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36,
            background: 'var(--bg-soft)',
            borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--black)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 2 }}>
            Liga Hypermotion 2025–26
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--black)', lineHeight: 1 }}>
            Himno AD Ceuta
          </div>
        </div>
      </div>

      {/* Hero negro */}
      <div style={{
        margin: '16px 12px 0',
        background: 'var(--black)',
        borderRadius: 'var(--radius)',
        padding: '20px',
        display: 'flex', alignItems: 'center', gap: 14,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(-45deg, transparent 0 7px, rgba(255,255,255,0.03) 7px 14px)' }} />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, position: 'relative', zIndex: 1 }}>
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'white', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            ¡Canta con nosotros!
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            El himno oficial del AD Ceuta FC
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
            Letra y música: Fran Amado &amp; Sarayma
          </div>
        </div>
      </div>

      {/* Letra */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {VERSES.map((verse, vi) => (
          <div key={vi}>
            {verse.chorus && (
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--red)', marginBottom: 8,
              }}>
                — Estribillo —
              </div>
            )}
            <div style={{
              borderLeft: `3px solid ${verse.chorus ? 'var(--red)' : 'var(--border)'}`,
              paddingLeft: 14,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              {verse.lines.map((line, li) => (
                <div key={li} style={{
                  fontFamily: verse.chorus ? 'var(--font-display)' : 'var(--font-body)',
                  fontSize: verse.chorus ? 17 : 15,
                  fontWeight: verse.chorus ? 700 : 400,
                  color: verse.chorus ? 'var(--black)' : 'var(--text)',
                  lineHeight: 1.5,
                  letterSpacing: verse.chorus ? '0.01em' : '0',
                  textTransform: verse.chorus ? 'uppercase' : 'none',
                }}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}
