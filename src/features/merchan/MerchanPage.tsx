'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

type MerchanProduct = {
  id: number
  name: string
  price: string
  url: string
  image: string
  category: 'equipaciones' | 'entrenamiento' | 'paseo' | 'merchandising'
  tag?: 'nuevo' | 'top' | null
  featured: boolean
}

const MERCHAN_CATEGORIES = [
  { id: 'equipaciones',  label: 'Equipaciones' },
  { id: 'entrenamiento', label: 'Entrenamiento' },
  { id: 'paseo',         label: 'Paseo' },
  { id: 'merchandising', label: 'Merchandising' },
] as const

const IconExt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function FeaturedCard({ product }: { product: MerchanProduct }) {
  return (
    <div className="-mt-[38px] mx-3 relative z-[2] rounded-[18px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
      <div className="relative h-[260px]">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) calc(100vw - 24px), 600px"
          className="object-cover object-top"
          priority
        />
        <span className="absolute top-[10px] left-[10px] bg-[var(--gold)] text-[var(--black)] font-display font-extrabold text-[10px] tracking-[0.1em] uppercase px-[9px] py-[5px] rounded-[6px] z-[2]">
          Novedad · Retro
        </span>
        <div
          className="absolute inset-x-0 bottom-0 px-[15px] pt-10 pb-[15px] z-[1]"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 55%, transparent 100%)' }}
        >
          <div className="font-display font-extrabold text-[22px] leading-none uppercase text-white">
            Camiseta jornada retro 25/26
          </div>
          <div className="text-[12px] text-white/60 mt-[5px]">
            La edición especial de jornada. Tallas 4XS–4XL.
          </div>
          <div className="flex items-center gap-3 mt-3">
            <span className="font-display font-black text-[24px] text-white">
              69<small className="text-[14px] font-bold">,00€</small>
            </span>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto bg-[var(--red)] !text-white font-display font-extrabold text-[13px] tracking-[0.08em] uppercase px-5 py-[11px] rounded-[10px] flex items-center gap-[7px] transition-colors no-underline"
            >
              Comprar <IconExt />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

const TAG_LABELS: Record<string, string> = { nuevo: 'Nuevo', top: 'Más vendido' }

function ProductCard({ product }: { product: MerchanProduct }) {
  const shortName = product.name
    .replace(/ AD Ceuta FC 25\/26/g, '')
    .replace(/ AD Ceuta FC 2025\/26/g, '')

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative rounded-[18px] overflow-hidden aspect-[3/4] block shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:scale-[0.97] transition-transform"
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 45vw, 200px"
        className="object-cover object-top"
        loading="lazy"
      />
      {product.tag && (
        <span className={`absolute top-2 left-2 z-10 font-display font-extrabold text-[9px] tracking-[0.1em] uppercase px-[7px] py-[4px] rounded-[5px] ${product.tag === 'nuevo' ? 'bg-[var(--red)] text-white' : 'bg-[var(--black)] text-white'}`}>
          {TAG_LABELS[product.tag]}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 z-10 px-[11px] pt-8 pb-[11px]"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)' }}
      >
        <div className="font-display font-extrabold text-[13px] leading-[1.1] uppercase text-white line-clamp-2">
          {shortName}
        </div>
        <div className="flex items-center justify-between mt-[7px] gap-2">
          <span className="font-display font-black text-[16px] text-white">
            {product.price.split(',')[0]}<small className="text-[10px] font-bold opacity-80">,{product.price.split(',')[1]}</small>
          </span>
          <span className="shrink-0 flex items-center gap-[5px] bg-[var(--red)] text-white font-display font-extrabold text-[10px] tracking-[0.06em] uppercase px-[9px] py-[6px] rounded-[7px]">
            Comprar <IconExt />
          </span>
        </div>
      </div>
    </a>
  )
}

const ALL_CAT = 'Todo'
const CATS = [ALL_CAT, ...MERCHAN_CATEGORIES.map(c => c.label)]
const CAT_MAP: Record<string, string> = Object.fromEntries(MERCHAN_CATEGORIES.map(c => [c.label, c.id]))

export default function MerchanPage() {
  const [activeCat, setActiveCat] = useState(ALL_CAT)
  const [products, setProducts] = useState<MerchanProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/merchan')
      .then(r => r.json())
      .then(data => setProducts(data.products ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const featured = products.find(p => p.featured)
  const filtered = activeCat === ALL_CAT
    ? products
    : products.filter(p => p.category === CAT_MAP[activeCat])

  return (
    <div>
      {/* Hero */}
      <div className="page-hero-full relative overflow-hidden bg-[var(--black)] px-[18px] pb-[52px] pt-[22px] text-white">
        <div
          className="pointer-events-none absolute bottom-0 right-[-40px] top-0 w-[180px]"
          style={{
            background: 'repeating-linear-gradient(-45deg, white 0 14px, #0A0A0A 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
          <div className="h-0.5 w-[18px] bg-[var(--red)]" />
          Tienda oficial · Envío gratis +100€
        </div>
        <div className="mt-2 font-display text-[38px] font-black uppercase leading-[0.95]">
          MERCHAN<em className="not-italic text-[var(--gold)]">DISING</em>
          <br />
          CABALLA
        </div>
      </div>

      {/* Featured card */}
      {!loading && featured && <FeaturedCard product={featured} />}

      {/* Chips */}
      <div className="chips sticky top-0 z-[100] bg-white/80 backdrop-blur-md pt-4 pb-4 mt-4 border-b border-[var(--border)]">
        {CATS.map(c => (
          <button key={c} className={`chip ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid header */}
      <div className="flex items-baseline justify-between px-4 pt-6 pb-[2px]">
        <span className="font-display font-extrabold text-[16px] tracking-[0.02em] uppercase">
          {activeCat === ALL_CAT ? 'Todo el catálogo' : activeCat}
        </span>
        <span className="text-[12px] text-[var(--muted)]">
          {loading ? '—' : `${filtered.length} artículos`}
        </span>
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-3 pt-[10px]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-[18px] bg-[var(--bg-soft)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div key={activeCat} className="grid grid-cols-2 gap-3 px-3 pt-[10px] isolate">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {/* Store note */}
      <div className="relative mx-3 mt-[18px] mb-2 bg-[var(--black)] rounded-[16px] px-[17px] py-4 text-white flex items-center gap-[14px] overflow-hidden">
        <div
          className="pointer-events-none absolute top-0 right-0 w-[120px] h-full opacity-[0.055]"
          style={{ background: 'repeating-linear-gradient(-45deg, #fff 0 12px, transparent 12px 24px)' }}
        />
        <div className="w-[42px] h-[42px] rounded-full bg-[var(--red)] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M6 7h12l1 13H5L6 7z" /><path d="M9 10V6a3 3 0 016 0v4" />
          </svg>
        </div>
        <div>
          <b className="font-display font-extrabold text-[15px] tracking-[0.04em] uppercase block">
            Pedidos en la tienda oficial
          </b>
          <p className="text-[12px] text-white/65 mt-[2px] leading-[1.4]">
            El botón Comprar te lleva a la tienda del AD Ceuta FC: mismo precio, pago seguro y todo el beneficio para el club.
          </p>
        </div>
      </div>

      <div className="pb-16" />
    </div>
  )
}
