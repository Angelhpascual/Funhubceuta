'use client'

import Image from 'next/image'

const STATS = [
  { v: '1933', l: 'Inauguración', red: true },
  { v: '6.000', l: 'Aforo actual', dark: true },
  { v: '8.500', l: 'Récord de entrada · 2008' },
  { v: '3', l: 'Visitas del Barça en Copa' },
]

const TIMELINE = [
  {
    year: '1933', tone: 'key',
    title: 'Nace «el Docker»',
    desc: 'Se inaugura el 4 de agosto como Campo Municipal de Deporte, obra del arquitecto José Blein (167.686 pesetas). El apodo venía de los barracones junto a la entrada. En el estreno, una selección de Ceuta ganó 1–0 al Murcia… reforzada nada menos que por Ricardo Zamora, el mítico portero de la selección española.',
    img: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta021018a.jpg',
    imgAlt: 'El estadio durante la década de 1940',
  },
  {
    year: '1942', tone: 'normal',
    title: 'El nombre de un jugador',
    desc: 'El estadio se rebautiza en honor a Alfonso Murube, centrocampista utrerano que jugó en Ceuta desde 1931, recordado por su clase organizando el juego, y fallecido en 1938 durante la Guerra Civil. El primer partido con el nuevo nombre se jugó el 25 de septiembre de 1942 contra el Málaga.',
    img: 'https://elfarodeceuta.es/wp-content/uploads/2023/08/colaboracion-paco-sanchez-aniversario-murube-2.jpg',
    imgAlt: 'Alfonso Murube, el jugador que da nombre al estadio',
  },
  {
    year: '1944', tone: 'normal',
    title: 'El Real Madrid, en Copa',
    desc: 'Tras un primer amistoso en 1942, el Madrid visita oficialmente el Murube el 31 de diciembre de 1944. Un año después, Ceuta le ganó 1–0 en casa en otra eliminatoria copera. En la 1942-43 el club fue campeón de grupo en Segunda y alcanzó los cuartos de Copa.',
  },
  {
    year: '1950s', tone: 'normal',
    title: 'El estadio crece',
    desc: 'Se amplían las gradas de los dos fondos y el aforo sube hasta las 6.500 localidades, cifra que se mantendría durante décadas.',
    img: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta281215f.jpg',
    imgAlt: 'El estadio en la década de 1960',
  },
  {
    year: '1961', tone: 'key',
    title: 'A 54 minutos de Primera',
    desc: 'El Atlético de Ceuta, segundo de su grupo, disputa la promoción de ascenso a Primera contra el Elche. Ganó la ida 1–0 fuera; en la vuelta, con nueve hombres, llegó a estar a 54 minutos de la máxima categoría. Nadie en Ceuta ha vuelto a estar tan cerca.',
  },
  {
    year: '1991', tone: 'normal',
    title: 'El abandono',
    desc: 'La desaparición de la Agrupación Deportiva deja al Murube sin fútbol y el estadio se deteriora hasta quedar inutilizable: el nuevo club de 1996 tuvo que jugar en el campo de tierra José Benoliel.',
    img: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta071106a.jpg',
    imgAlt: 'El estadio en su etapa de abandono, años 90',
  },
  {
    year: '1997', tone: 'key',
    title: 'La reconstrucción',
    desc: 'Prácticamente reconstruido, reabre el 8 de octubre de 1997 con un «derbi del Estrecho»: victoria 4–2 sobre el Algeciras. Un campo con suerte — esa misma temporada, ascenso a Segunda B.',
    img: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta160226a.jpg',
    imgAlt: 'El Murube en 2005',
  },
  {
    year: '2001', tone: 'normal',
    title: 'Noches grandes',
    desc: 'El Barça visita el Murube en Copa con las gradas a reventar (2001, y volvería en 2010 y 2023). En 2002, primer partido de una selección española en Ceuta: la sub-21 ganó 2–1 a Yugoslavia con goles de Reyes y un jovencísimo Fernando Torres, junto a Reina, Xabi Alonso y Arteta.',
  },
  {
    year: '2008', tone: 'normal',
    title: 'El récord de todos los tiempos',
    desc: 'Play-off de ascenso contra el Girona, 8 de junio: más de 8.500 espectadores en un estadio de 6.500 asientos. Sigue siendo la mayor entrada jamás registrada en el Murube.',
  },
  {
    year: '2023', tone: 'normal',
    title: '90 años, y el Barça de nuevo',
    desc: 'El 4 de agosto de 2023 el estadio cumple 90 años. Ese mismo año recibe otra vez al FC Barcelona en Copa del Rey, con lleno absoluto de 6.500 espectadores.',
  },
  {
    year: '2024', tone: 'gold',
    title: 'Ascenso a Primera Federación',
    desc: 'El club elimina al Navalcarnero y a la Unión Adarve en el play-off y da el primer salto del gran bienio.',
    img: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta300524a.jpg',
    imgAlt: 'Celebración del ascenso a Primera Federación, mayo 2024',
  },
  {
    year: '2025', tone: 'gold',
    title: 'Segunda División y gran reforma',
    desc: 'Campeón de grupo tras 24 partidos sin perder: Ceuta vuelve al fútbol profesional 44 años después. El ascenso obliga a una reforma exprés de 5 millones de euros — vestuarios, sala de prensa, palcos VIP, sala VAR y nueva grada de preferencia. El Murube renovado reabre el 23 de agosto de 2025 ante el Sporting de Gijón.',
    imgs: [
      { src: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta200525e.jpg', alt: 'Celebración del ascenso a Segunda División, mayo 2025', caption: 'Celebración del ascenso a Segunda · mayo 2025' },
      { src: 'https://espanaestadios.com/wp-content/uploads/2018/12/ceuta240825a.jpg', alt: 'El Murube renovado, listo para la Segunda División, 2025', caption: 'El Murube renovado, listo para Segunda · 2025' },
    ],
  },
]

const CURIOSIDADES = [
  { n: '3', text: <><b>Tres nombres en nueve años:</b> Campo Municipal de Deporte, «el Docker» y, desde 1942, Alfonso Murube.</> },
  { n: '3', text: <><b>Tres visitas del Barça</b> en Copa del Rey (2001, 2010 y 2023) — siempre con lleno absoluto.</> },
  { n: '54', text: <><b>Los 54 minutos de 1961:</b> lo más cerca que un equipo ceutí ha estado nunca de la Primera División.</> },
  { n: '5M', text: <><b>Cinco millones de euros</b> de reforma en 2025 para cumplir los requisitos de LaLiga, entregada justo a tiempo para el debut ante el Sporting.</> },
]

const FICHA = [
  { n: '6.000', l: 'Aforo' },
  { n: '4.300', l: 'Abonados · 26/27' },
  { n: '4 · 8 · 1933', l: 'Inauguración' },
  { n: 'Natural', l: 'Césped' },
  { n: '2025', l: 'Última reforma' },
  { n: '8.500', l: 'Récord de entrada' },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] px-4 pt-[14px] pb-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)]">
      {children}
      <div className="h-px flex-1 bg-[var(--border)]" />
    </div>
  )
}

function TimelineImg({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="mt-[10px] overflow-hidden rounded-[8px] border border-[var(--border)]">
      <div className="relative h-[150px] w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
      </div>
      <figcaption className="bg-[var(--bg-soft)] px-3 py-2 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
        {caption}
      </figcaption>
    </figure>
  )
}

export function EstadioTab() {
  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-[var(--black)] px-5 pb-[26px] pt-[30px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-30px] top-0 w-[230px] opacity-[0.07]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 12px, #0A0A0A 12px 24px)',
            clipPath: 'polygon(70px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="pointer-events-none absolute right-[14px] top-[-6px] font-display text-[120px] font-black leading-[0.8] text-white/[0.05]">1933</div>
        <div className="relative flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
          <div className="h-0.5 w-[18px] bg-[var(--red)]" />
          El templo caballa
        </div>
        <h2 className="relative mt-[10px] font-display text-[40px] font-black uppercase leading-[0.95]">
          Alfonso Murube,{' '}
          <em className="not-italic text-[var(--gold)]">90 años</em>{' '}
          de historia
        </h2>
        <p className="relative mt-3 text-[14px] leading-[1.5] text-white/70">
          Del «Docker» de 1933 al estadio renovado que hoy recibe a la Segunda División. La historia del Murube es la historia del fútbol ceutí.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 p-4">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={`rounded-[14px] border p-4 ${
              s.red ? 'border-[var(--red)] bg-[var(--red)]' :
              s.dark ? 'border-[var(--black)] bg-[var(--black)]' :
              'border-[var(--border)] bg-white'
            }`}
          >
            <div className={`font-display text-[34px] font-black leading-none ${(s.red || s.dark) ? 'text-white' : 'text-[var(--black)]'}`}>{s.v}</div>
            <div className={`mt-[6px] font-display text-[10.5px] font-bold uppercase tracking-[0.1em] ${(s.red || s.dark) ? 'text-white/70' : 'text-[var(--muted)]'}`}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <SectionLabel>Cronología del estadio</SectionLabel>
      <div className="relative pl-[38px] pr-4">
        <div className="absolute bottom-[6px] left-[22px] top-[6px] w-0.5 bg-[var(--border)]" />
        {TIMELINE.map((e, i) => (
          <div key={i} className={`relative pb-6 pl-[18px] ${i === TIMELINE.length - 1 ? 'pb-[6px]' : ''}`}>
            <div
              className={`absolute left-[-23px] top-[3px] size-3 rounded-full border-[3px] ${
                e.tone === 'key' ? 'border-[var(--red)] bg-[var(--red)]' :
                e.tone === 'gold' ? 'border-[var(--gold)] bg-[var(--gold)]' :
                'border-[var(--muted)] bg-white'
              }`}
            />
            <div className={`font-display text-[22px] font-black leading-none ${
              e.tone === 'key' ? 'text-[var(--red)]' :
              e.tone === 'gold' ? 'text-[#B8930A]' :
              'text-[var(--black)]'
            }`}>{e.year}</div>
            <div className="mt-[3px] font-display text-[15px] font-bold uppercase tracking-[0.02em]">{e.title}</div>
            <p className="mt-1 text-[13px] leading-[1.45] text-[var(--muted)]">{e.desc}</p>
            {e.img && <TimelineImg src={e.img} alt={e.imgAlt!} caption={e.imgAlt!} />}
            {e.imgs && e.imgs.map((img, j) => (
              <TimelineImg key={j} src={img.src} alt={img.alt} caption={img.caption} />
            ))}
          </div>
        ))}
      </div>

      {/* Anécdota */}
      <SectionLabel>La anécdota</SectionLabel>
      <div className="px-4 pb-0">
        <figure className="overflow-hidden rounded-[8px] border border-[var(--border)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://elfarodeceuta.es/wp-content/uploads/2023/08/colaboracion-paco-sanchez-aniversario-murube-3.jpg"
            alt="Ricardo Zamora en su visita a Ceuta, 1933"
            className="h-[220px] w-full object-cover object-[center_8%]"
            loading="lazy"
          />
          <figcaption className="bg-[var(--bg-soft)] px-3 py-2 font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            Ricardo Zamora en su visita a Ceuta · 1933
          </figcaption>
        </figure>
      </div>
      <div className="mx-4 mt-2 flex gap-3 rounded-[14px] bg-[var(--bg-soft)] p-4">
        <div className="flex-shrink-0 font-display text-[36px] font-black leading-[0.8] text-[var(--red)]">"</div>
        <p className="text-[13px] leading-[1.5] text-[#444]">
          <b>Zamora, padre en Ceuta.</b> El gran Ricardo Zamora forzó para jugar la inauguración de 1933 pese a que su mujer estaba a punto de dar a luz — y su hijo nació durante su estancia en la ciudad. En un partido posterior, la afición caballa le desplegó una pancarta para felicitarlo.
        </p>
      </div>

      {/* Curiosidades */}
      <SectionLabel>Curiosidades</SectionLabel>
      <div className="flex flex-col gap-2 px-4">
        {CURIOSIDADES.map((c, i) => (
          <div key={i} className="flex items-baseline gap-[13px] rounded-[14px] border border-[var(--border)] px-[15px] py-[13px]">
            <div className="min-w-[22px] flex-shrink-0 font-display text-[20px] font-black text-[var(--red)]">{c.n}</div>
            <p className="text-[13px] leading-[1.45] text-[#444]">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Foto actual del estadio */}
      <SectionLabel>El estadio hoy</SectionLabel>
      <div className="mx-4 mb-4 overflow-hidden rounded-[14px] border border-[var(--border)]">
        <div className="relative h-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/api/proxy/image?url=https%3A%2F%2Fstatic.elpueblodeceuta.es%2Fclip%2Ff2461653-947e-4115-b9e3-e53a34fc5db7_16-9-aspect-ratio_1600w_0.webp"
            alt="Estadio Alfonso Murube"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(14,14,14,0.5) 100%)' }} />
          <div className="absolute bottom-3 left-3 flex items-center gap-[6px] rounded-full bg-black/60 px-3 py-[5px] font-display text-[11px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" className="h-[14px] w-[14px]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Murube · Ceuta
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="font-display text-[16px] font-extrabold uppercase tracking-[0.02em]">Alfonso Murube</div>
          <div className="mt-[3px] text-[12.5px] text-[var(--muted)]">Ceuta · Inaugurado en 1933 · Reformado en 2025</div>
        </div>
      </div>

      {/* Ficha */}
      <SectionLabel>Ficha del estadio</SectionLabel>
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--border)]">
          {FICHA.map((f, i) => (
            <div key={i} className="bg-white px-[13px] py-[11px]">
              <div className="font-display text-[18px] font-extrabold">{f.n}</div>
              <div className="mt-[2px] font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">{f.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
