import Image from 'next/image'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] px-4 pt-[14px] pb-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red)]">
      {children}
      <span className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

type TimelineEntry = {
  year: string
  title: string
  desc: string
  tone?: 'key' | 'gold'
  image?: { src: string; alt: string; caption: string; contain?: boolean }
  images?: { src: string; alt: string; caption: string; contain?: boolean }[]
}

const TIMELINE: TimelineEntry[] = [
  {
    year: '1990s',
    title: 'El antecedente: «Supercaballa»',
    desc: 'Cuando reabrió el Murube tras su reconstrucción, un aficionado se disfrazó de «Supercaballa» —una caballa vestida de Superman— y saltó al campo en un par de partidos. No era oficial, pero la imagen quedó grabada en la memoria de quien años después crearía a Caballati.',
  },
  {
    year: '2022',
    title: 'Nace Caballati, casi de broma',
    desc: 'En un debate en Facebook sobre qué mascota debería tener el Ceuta —se propuso una gaviota, hasta un águila al estilo NBA— el periodista Juanmi Armuña comentó en broma que lo suyo era una caballa… y que él encantado de vestirla. Etiquetó al presidente Luhay Hamido, que respondió con una palabra: «contratado». Con el traje de Diego Fernández, Caballati debutó en diciembre contra el Deportivo de La Coruña.',
    tone: 'key',
    image: {
      src: '/mascota/1ccfe11cb753b71b2abbbb3845677349eb6cddd8.jpg',
      alt: 'Caballati saludando en la pescadería',
      caption: 'En la pescadería, guiño a su origen marinero',
    },
  },
  {
    year: '2023',
    title: 'Viral: temida en Japón, adorada en Alemania',
    desc: 'Para la Copa del Rey contra el Barça, el club lanzó un cartel parodiando el póster de Tiburón con Caballati de escualo. La imagen corrió como la pólvora: una cuenta japonesa con más de 20.000 seguidores decía que daba «tanto miedo que se ha vuelto popular», y una alemana pedía «ver más a Caballati».',
    tone: 'key',
    images: [
      { src: '/mascota/fa39266f55c2f253382249076e332732e5de4a65.jpg', alt: 'Tweet japonés sobre Caballati', caption: 'Cuenta japonesa · @LADSFOOTBALL', contain: true },
      { src: '/mascota/sweeper_tweet_2023.jpg', alt: 'Tweet de The Sweeper sobre Caballati', caption: 'The Sweeper · @SweeperPod', contain: true },
    ],
  },
  {
    year: '2024',
    title: 'Ídolo de los más pequeños',
    desc: 'Caballati se consolida como referente de la afición, sobre todo entre los niños. Y protagoniza un hermanamiento insólito: pasó un día entero con Mirandín, la mascota del Algeciras, pese a la rivalidad del «derbi del Estrecho».',
    image: {
      src: '/mascota/385aef8949667cc15d869e3521778b40a466a406.jpg',
      alt: 'Caballati posando con familias',
      caption: 'Con las familias, uno de sus papeles favoritos',
    },
  },
  {
    year: '2025',
    title: 'El ascenso y la «nueva piel»',
    desc: 'Vive el histórico ascenso a Segunda y, en el debut ante el Sporting en el Murube renovado, estrena un traje completamente nuevo fabricado en Zaragoza: rasgos más marcados, ojos brillantes, detalles azulados, aletas, cola y botas negras al estilo de las antiguas Adidas Copa. Ya se codea con Koki (Córdoba), Pulevín (Granada) o Pepe Zorrillo (Valladolid).',
    tone: 'gold',
    image: {
      src: '/mascota/d7d22a78a3c5b1866a5155d27a34c3849b71f8c0.jpg',
      alt: 'Caballati celebrando el ascenso con la afición',
      caption: 'Celebrando el ascenso con la afición · 2025',
    },
  },
  {
    year: '2026',
    title: 'LaLiga de las Mascotas y el guiño a Punch',
    desc: 'Representa al Ceuta en LaLiga de las Mascotas en La Cartuja. Y en febrero protagoniza un momento tierno: posa junto a Punch, el pequeño mono japonés viral criado con un peluche, bajo el mensaje «aquí nadie se siente solo».',
  },
]

export function CaballatiTab() {
  return (
    <div className="pb-6">
      {/* Hero */}
      <div className="relative bg-[var(--black)] text-white overflow-hidden">
        <div className="relative h-[250px]">
          <Image
            src="/mascota/74ece1209f0c59c6146a1afa5fbfeef598e6ce09.jpg"
            alt="Caballati con su nueva piel, 2025"
            fill
            sizes="(max-width: 640px) 100vw, 440px"
            className="object-cover object-[center_20%]"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(0deg, #0A0A0A 4%, rgba(10,10,10,.25) 55%, rgba(10,10,10,.15))' }}
          />
        </div>
        <div className="relative -mt-[46px] px-5 pb-6">
          <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
            <span className="w-[18px] h-0.5 bg-[var(--red)]" />
            La mascota
          </div>
          <h1 className="mt-2 font-display text-[44px] font-black uppercase leading-[0.92]">
            Caballati, <em className="not-italic text-[var(--gold)]">el alma</em> del Ceuta
          </h1>
          <p className="mt-[10px] text-[14px] leading-[1.5] text-white/75">
            De una broma en Facebook a fenómeno viral en medio mundo. La primera mascota oficial de la historia del club.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 p-4">
        <div className="bg-[var(--red)] rounded-[14px] p-4">
          <div className="font-display font-black text-[30px] leading-none text-white">2022</div>
          <div className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/70 mt-[6px]">Debut · vs Deportivo</div>
        </div>
        <div className="bg-[var(--black)] rounded-[14px] p-4">
          <div className="font-display font-black text-[30px] leading-none text-white">1ª</div>
          <div className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/70 mt-[6px]">Mascota oficial del club</div>
        </div>
        <div className="border border-[var(--border)] rounded-[14px] p-4">
          <div className="font-display font-black text-[30px] leading-none text-[var(--black)]">2023</div>
          <div className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] mt-[6px]">Viral en medio mundo</div>
        </div>
        <div className="border border-[var(--border)] rounded-[14px] p-4">
          <div className="font-display font-black text-[30px] leading-none text-[var(--black)]">2025</div>
          <div className="font-display text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] mt-[6px]">Estrena «nueva piel»</div>
        </div>
      </div>

      {/* Timeline */}
      <SectionLabel>Su historia</SectionLabel>
      <div className="relative pl-[38px] pr-4">
        <div
          className="absolute left-[22px] top-[6px] bottom-[6px] w-0.5 bg-[var(--border)]"
        />
        {TIMELINE.map((e) => (
          <div key={e.year} className="relative pb-6 pl-[18px] last:pb-[6px]">
            <div
              className={`absolute left-[-23px] top-[3px] size-3 rounded-full border-[3px] ${
                e.tone === 'key'
                  ? 'border-[var(--red)] bg-[var(--red)]'
                  : e.tone === 'gold'
                  ? 'border-[var(--gold)] bg-[var(--gold)]'
                  : 'border-[var(--muted)] bg-white'
              }`}
            />
            <div
              className={`font-display font-black text-[22px] leading-none ${
                e.tone === 'key'
                  ? 'text-[var(--red)]'
                  : e.tone === 'gold'
                  ? 'text-[#B8930A]'
                  : 'text-[var(--black)]'
              }`}
            >
              {e.year}
            </div>
            <div className="font-display font-bold text-[15px] uppercase tracking-[0.02em] mt-[3px]">
              {e.title}
            </div>
            <p className="text-[13px] leading-[1.45] text-[var(--muted)] mt-1">{e.desc}</p>
            {e.image && (
              <figure className="mt-[10px] rounded-[8px] overflow-hidden border border-[var(--border)]">
                <div className="relative h-[200px] bg-[var(--bg-soft)]">
                  <Image
                    src={e.image.src}
                    alt={e.image.alt}
                    fill
                    sizes="(max-width: 640px) 90vw, 380px"
                    className={`${e.image.contain ? 'object-contain' : 'object-cover object-[center_15%]'}`}
                    loading="lazy"
                  />
                </div>
                <figcaption className="font-display font-bold text-[10.5px] uppercase tracking-[0.1em] text-[var(--muted)] px-3 py-2 bg-[var(--bg-soft)]">
                  {e.image.caption}
                </figcaption>
              </figure>
            )}
            {e.images && (
              <div className="mt-[10px] grid grid-cols-2 gap-[8px]">
                {e.images.map((img, idx) => (
                  <figure key={idx} className="rounded-[8px] overflow-hidden border border-[var(--border)]">
                    <div className="relative h-[160px] bg-[var(--bg-soft)]">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(max-width: 640px) 45vw, 190px"
                        className={`${img.contain ? 'object-contain' : 'object-cover object-[center_15%]'}`}
                        loading="lazy"
                      />
                    </div>
                    <figcaption className="font-display font-bold text-[9px] uppercase tracking-[0.1em] text-[var(--muted)] px-2 py-2 bg-[var(--bg-soft)]">
                      {img.caption}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quote */}
      <SectionLabel>La cita</SectionLabel>
      <div className="mx-4 mt-1 bg-[var(--bg-soft)] rounded-[14px] p-4 flex gap-3">
        <div className="font-display font-black text-[36px] text-[var(--red)] leading-[0.8] flex-shrink-0">"</div>
        <p className="text-[13px] leading-[1.5] text-[#444]">
          <strong className="text-[var(--black)]">«Es algo más que el disfraz».</strong> Para Juanmi Armuña, su creador, Caballati representa los valores de deportividad y respeto al rival. Su sueño, decía en broma: «celebrar el ascenso y una Champions… lo primero ya lo hemos conseguido, lo segundo nunca se sabe».
        </p>
      </div>

      {/* Curiosidades */}
      <SectionLabel>Curiosidades</SectionLabel>
      <div className="px-4 flex flex-col gap-2">
        {[
          { n: '1ª', text: <><strong className="text-[var(--black)]">La primera mascota oficial</strong> de la historia del club — antes solo existió el episodio no oficial de «Supercaballa».</> },
          { n: 'RAE', text: <>La caballa no es casualidad: la RAE reconoce <strong className="text-[var(--black)]">«caballa» como gentilicio de los ceutíes</strong>.</> },
          { n: '🦈', text: <>Su mayor momento mediático no fue un gol: fue el <strong className="text-[var(--black)]">cartel parodiando Tiburón</strong> de enero de 2023.</> },
          { n: '🎭', text: <>Su creador es también <strong className="text-[var(--black)]">pregonero del Carnaval de Ceuta</strong> — de ahí su pasión por los disfraces.</> },
        ].map((c, i) => (
          <div key={i} className="flex gap-[13px] border border-[var(--border)] rounded-[14px] p-[13px_15px] items-center">
            <div className="font-display font-black text-[20px] text-[var(--red)] flex-shrink-0 min-w-[22px]">{c.n}</div>
            <p className="text-[13px] leading-[1.45] text-[#444]">{c.text}</p>
          </div>
        ))}
      </div>

      {/* Ficha */}
      <SectionLabel>Ficha</SectionLabel>
      <div className="px-4 pb-6">
        <div className="grid grid-cols-2 gap-px bg-[var(--border)] border border-[var(--border)] rounded-[8px] overflow-hidden">
          {[
            { n: 'Caballati', l: 'Nombre' },
            { n: 'Caballa', l: 'Especie · emblema de Ceuta' },
            { n: 'Dic. 2022', l: 'Debut' },
            { n: 'Zaragoza', l: 'Traje 2025' },
            { n: 'Mirandín', l: 'Mascota hermanada' },
            { n: 'La Cartuja', l: 'LaLiga de las Mascotas' },
          ].map((f, i) => (
            <div key={i} className="bg-white p-[11px_13px]">
              <div className="font-display font-extrabold text-[17px]">{f.n}</div>
              <div className="font-display text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)] mt-[2px]">{f.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
