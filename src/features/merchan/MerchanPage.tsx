'use client'

import { useState } from 'react'
import { MERCHAN_PRODUCTS, MERCHAN_CATEGORIES, type MerchanProduct } from '@/lib/merchan'

const IconExt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function FeaturedCard({ product }: { product: MerchanProduct }) {
  return (
    <div className="-mt-[38px] mx-3 relative z-[2] bg-white border-[1.5px] border-[var(--border)] rounded-[var(--r-md)] overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
      <div className="h-[210px] bg-[var(--bg-soft)] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="w-full h-full object-contain bg-white" />
        <span className="absolute top-[10px] left-[10px] bg-[var(--gold)] text-[var(--black)] font-display font-extrabold text-[10px] tracking-[0.1em] uppercase px-[9px] py-[5px] rounded-[5px] z-[2]">
          Novedad · Retro
        </span>
      </div>
      <div className="px-[15px] pt-[14px] pb-[15px]">
        <div className="font-display font-extrabold text-[21px] leading-none uppercase">
          Camiseta jornada retro 25/26
        </div>
        <div className="text-[12.5px] text-[var(--muted)] mt-[5px]">
          La edición especial de jornada. Tallas 4XS–4XL.
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="font-display font-black text-[24px]">
            69<small className="text-[14px] font-bold">,00€</small>
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto bg-[var(--red)] hover:bg-[var(--red-dark)] text-white font-display font-extrabold text-[13px] tracking-[0.08em] uppercase px-4 py-[11px] rounded-[10px] flex items-center gap-[7px] transition-colors"
          >
            Comprar <IconExt />
          </a>
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
      className="bg-white border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden flex flex-col"
    >
      <div className="h-[150px] bg-[var(--bg-soft)] relative">
        {product.tag && (
          <span className={`absolute top-2 left-2 font-display font-extrabold text-[9px] tracking-[0.1em] uppercase px-[7px] py-1 rounded-[4px] ${product.tag === 'nuevo' ? 'bg-[var(--red)] text-white' : 'bg-[var(--black)] text-white'}`}>
            {TAG_LABELS[product.tag]}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain bg-white" />
      </div>
      <div className="px-3 pt-[11px] pb-3 flex flex-col flex-1">
        <div className="font-display font-extrabold text-[15.5px] leading-[1.05] uppercase">
          {shortName}
        </div>
        <div className="text-[11px] text-[var(--muted)] mt-[3px] capitalize">{product.category}</div>
        <div className="flex items-center mt-auto pt-[10px]">
          <span className="font-display font-black text-[18px]">
            {product.price.split(',')[0]}<small className="text-[11px] font-bold">,{product.price.split(',')[1]}</small>
          </span>
          <span className="ml-auto w-[34px] h-[34px] rounded-[9px] bg-[var(--red)] text-white flex items-center justify-center">
            <IconExt />
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

  const featured = MERCHAN_PRODUCTS.find(p => p.featured)
  const filtered = activeCat === ALL_CAT
    ? MERCHAN_PRODUCTS
    : MERCHAN_PRODUCTS.filter(p => p.category === CAT_MAP[activeCat])

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-[var(--black)] text-white px-[18px] pt-6 pb-14 overflow-hidden">
        <div
          className="pointer-events-none absolute -top-[30px] -right-[50px] w-[200px] h-[200px] opacity-[0.07] rotate-[8deg]"
          style={{
            background: 'repeating-linear-gradient(-45deg, #fff 0 14px, #000 14px 28px)',
            clipPath: 'polygon(70px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
          <span className="w-[18px] h-[2px] bg-[var(--red)] flex-shrink-0" />
          Tienda oficial
        </div>
        <div className="font-display font-black text-[40px] uppercase leading-[0.92] mt-[10px] relative z-[1]">
          MERCHAN<br /><span className="text-[var(--gold)]">CABALLA</span>
        </div>
        <div className="flex items-center gap-[7px] text-[12.5px] text-white/60 mt-[10px]">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-[13px] h-[13px] flex-shrink-0 stroke-[var(--gold)]">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" />
          </svg>
          Envío gratis en compras superiores a 100€ · tienda oficial
        </div>
      </div>

      {/* Featured card */}
      {featured && <FeaturedCard product={featured} />}

      {/* Chips */}
      <div className="chips sticky top-[var(--top-h)] z-[100] bg-[var(--bg)] pt-4 pb-[6px] border-b border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        {CATS.map(c => (
          <button key={c} className={`chip ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid header */}
      <div className="flex items-baseline justify-between px-4 pt-[14px] pb-[2px]">
        <span className="font-display font-extrabold text-[16px] tracking-[0.02em] uppercase">
          {activeCat === ALL_CAT ? 'Todo el catálogo' : activeCat}
        </span>
        <span className="text-[12px] text-[var(--muted)]">{filtered.length} artículos</span>
      </div>

      {/* Product grid */}
      <div key={activeCat} className="grid grid-cols-2 gap-[10px] px-3 pt-[10px] isolate">
        {filtered.map(p => <ProductCard key={p.url} product={p} />)}
      </div>

      {/* Store note */}
      <div className="relative mx-3 mt-[18px] mb-2 bg-[var(--black)] rounded-[var(--r-md)] px-[17px] py-4 text-white flex items-center gap-[14px] overflow-hidden">
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

      <div className="pb-6" />
    </div>
  )
}
