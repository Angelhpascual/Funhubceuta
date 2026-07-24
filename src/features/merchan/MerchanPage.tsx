'use client'

import { useState } from 'react'
import { MERCHAN_PRODUCTS, MERCHAN_CATEGORIES, type MerchanProduct } from '@/lib/merchan'

const IconExternal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

function FeaturedCard({ product }: { product: MerchanProduct }) {
  return (
    <div className="-mt-[38px] mx-3 relative z-[3] bg-white border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden shadow-[var(--shadow-pop)]">
      <div className="h-[200px] bg-[var(--bone)] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="w-full h-full object-contain bg-white" />
        <span className="absolute top-2.5 left-2.5 bg-[var(--black)] text-white font-display font-extrabold text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-[var(--r-sm)]">
          Novedad · Retro
        </span>
      </div>
      <div className="px-4 py-3.5">
        <div className="font-display font-extrabold text-[20px] uppercase leading-tight">
          Camiseta jornada retro 25/26
        </div>
        <div className="text-[13px] text-[var(--muted)] mt-1">
          Edición especial de jornada — Tallas 4XS a 4XL
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="font-display font-black text-[22px]">
            69<small className="text-sm font-bold">,00 €</small>
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto match-cta flex items-center gap-1.5"
          >
            Comprar <IconExternal />
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
      className="bg-white border border-[var(--border)] rounded-[var(--r-md)] overflow-hidden flex flex-col active:scale-[0.98] transition-transform"
    >
      <div className="h-[150px] bg-[var(--bone)] relative">
        {product.tag && (
          <span className={`absolute top-2 left-2 font-display font-extrabold text-[9px] tracking-[0.1em] uppercase px-[7px] py-1 rounded-[var(--r-sm)] z-[2] ${product.tag === 'nuevo' ? 'bg-[var(--red)] text-white' : 'bg-[var(--black)] text-white'}`}>
            {TAG_LABELS[product.tag]}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain bg-white" />
      </div>
      <div className="px-3 py-2.5 flex flex-col flex-1">
        <div className="font-display font-extrabold text-[15px] uppercase leading-[1.05]">
          {shortName}
        </div>
        <div className="text-[11px] text-[var(--muted)] mt-0.5 capitalize">{product.category}</div>
        <div className="flex items-center mt-auto pt-2.5">
          <span className="font-display font-black text-[17px]">
            {product.price.split(',')[0]}<small className="text-[11px] font-bold">,{product.price.split(',')[1]}</small>
          </span>
          <span className="ml-auto w-8 h-8 rounded-[var(--r-sm)] bg-[var(--red)] text-white flex items-center justify-center">
            <IconExternal />
          </span>
        </div>
      </div>
    </a>
  )
}

const ALL_CAT = 'todo'

export default function MerchanPage() {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CAT)

  const featured = MERCHAN_PRODUCTS.find(p => p.featured)
  const filtered = activeCategory === ALL_CAT
    ? MERCHAN_PRODUCTS
    : MERCHAN_PRODUCTS.filter(p => p.category === activeCategory)

  const gridLabel = activeCategory === ALL_CAT
    ? 'Todo el catálogo'
    : MERCHAN_CATEGORIES.find(c => c.id === activeCategory)?.label ?? ''

  return (
    <div>
      {/* Hero — mismo patrón que PartidosPage */}
      <div className="page-hero-full relative overflow-hidden bg-[var(--black)] px-[18px] pb-14 pt-[22px] text-white">
        {/* franjas diagonales decorativas (6% opacidad — patrón del sistema) */}
        <div
          className="pointer-events-none absolute -top-8 -right-12 w-48 h-48 opacity-[0.06]"
          style={{
            background: 'repeating-linear-gradient(-45deg, #fff 0 14px, transparent 14px 28px)',
            clipPath: 'polygon(60px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--red)]">
          <span className="w-4 h-[2px] bg-[var(--red)]" />
          Tienda oficial
        </div>
        <div className="font-display font-black text-[36px] uppercase leading-[0.92] mt-2 relative z-[1]">
          Tienda<br /><span className="text-[var(--muted)]">AD Ceuta FC</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/55 mt-2.5">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" className="w-3 h-3 flex-shrink-0 stroke-white/55">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" />
          </svg>
          tienda.adceutafc.com · pago seguro · envío a Ceuta
        </div>
      </div>

      {/* Tarjeta destacada */}
      {featured && <FeaturedCard product={featured} />}

      {/* Chips por categoría — sticky */}
      <div className="chips sticky top-[var(--top-h)] z-50 bg-[var(--bg)] pt-4 pb-1.5">
        <button className={`chip ${activeCategory === ALL_CAT ? 'active' : ''}`} onClick={() => setActiveCategory(ALL_CAT)}>
          Todo
        </button>
        {MERCHAN_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cabecera de sección */}
      <div className="sec-header pt-2 pb-0">
        <div>
          <div className="sec-title-small">AD Ceuta FC · 25/26</div>
          <div className="sec-title">{gridLabel}</div>
        </div>
        <span className="text-[13px] text-[var(--muted)]">{filtered.length} artículos</span>
      </div>

      {/* Grid de productos */}
      <div key={activeCategory} className="grid grid-cols-2 gap-2.5 px-3 pt-3 pb-2">
        {filtered.map(product => (
          <ProductCard key={product.url} product={product} />
        ))}
      </div>

      {/* Nota de tienda — stat-tile dark */}
      <div className="mx-3 mt-3 mb-2 stat-tile dark flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[var(--red)] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M6 7h12l1 13H5L6 7z" /><path d="M9 10V6a3 3 0 016 0v4" />
          </svg>
        </div>
        <div>
          <div className="font-display font-extrabold text-[14px] uppercase tracking-[0.04em]">Tienda oficial del club</div>
          <p className="text-[12px] text-white/60 mt-0.5 leading-snug">
            Cada compra va directamente al AD Ceuta FC. Precio oficial, pago seguro.
          </p>
        </div>
      </div>

      <div className="pb-6" />
    </div>
  )
}
