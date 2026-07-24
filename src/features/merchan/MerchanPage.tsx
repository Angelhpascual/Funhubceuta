'use client'

import { useState } from 'react'
import { MERCHAN_PRODUCTS, MERCHAN_CATEGORIES, type MerchanProduct } from '@/lib/merchan'

const STORE_URL = 'https://tienda.adceutafc.com'

const IconExternal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[13px] h-[13px]">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const IconBag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M6 7h12l1 13H5L6 7z" />
    <path d="M9 10V6a3 3 0 016 0v4" />
  </svg>
)

function FeaturedCard({ product }: { product: MerchanProduct }) {
  return (
    <div className="-mt-[38px] mx-3 relative z-[3] bg-white border-[1.5px] border-[var(--border)] rounded-[var(--radius)] overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.08)]">
      <div className="h-[210px] bg-[var(--bg-soft)] relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain bg-white"
        />
        <span className="absolute top-[10px] left-[10px] bg-[var(--gold)] text-[var(--black)] font-[var(--font-display)] font-extrabold text-[10px] tracking-[0.1em] uppercase px-[9px] py-[5px] rounded-[5px] z-[2]">
          Novedad · Retro
        </span>
      </div>
      <div className="px-[15px] py-[14px]">
        <div className="font-[var(--font-display)] font-extrabold text-[21px] leading-none uppercase">
          Camiseta jornada retro 25/26
        </div>
        <div className="text-[12.5px] text-[var(--muted)] mt-[5px]">
          La edición especial de jornada. Tallas 4XS–4XL.
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="font-[var(--font-display)] font-black text-[24px]">
            69<small className="text-sm font-bold">,00€</small>
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto bg-[var(--red)] hover:bg-[var(--red-dark)] text-white font-[var(--font-display)] font-extrabold text-[13px] tracking-[0.08em] uppercase px-4 py-[11px] rounded-[10px] flex items-center gap-[7px] transition-colors"
          >
            Comprar <IconExternal />
          </a>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, index }: { product: MerchanProduct; index: number }) {
  const delays = ['', 'delay-[50ms]', 'delay-[100ms]', 'delay-[150ms]', 'delay-[200ms]', 'delay-[250ms]']
  const delay = delays[index] ?? ''

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`bg-white border border-[var(--border)] rounded-[var(--radius)] overflow-hidden flex flex-col animate-[cardIn_0.36s_ease_backwards] ${delay}`}
    >
      <div className="h-[150px] bg-[var(--bg-soft)] relative">
        {product.tag && (
          <span className={`absolute top-2 left-2 font-[var(--font-display)] font-extrabold text-[9px] tracking-[0.1em] uppercase px-[7px] py-1 rounded-[4px] z-[2] ${product.tag === 'nuevo' ? 'bg-[var(--red)] text-white' : 'bg-[var(--black)] text-white'}`}>
            {product.tag === 'nuevo' ? 'Nuevo' : 'Más vendido'}
          </span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain bg-white"
        />
      </div>
      <div className="px-3 py-[11px] flex flex-col flex-1">
        <div className="font-[var(--font-display)] font-extrabold text-[15.5px] leading-[1.05] uppercase">
          {product.name.replace(' AD Ceuta FC 25/26', '').replace(' AD Ceuta FC 2025/26', '')}
        </div>
        <div className="text-[11px] text-[var(--muted)] mt-[3px] capitalize">
          {product.category}
        </div>
        <div className="flex items-center mt-auto pt-[10px]">
          <span className="font-[var(--font-display)] font-black text-[18px]">
            {product.price.split(',')[0]}<small className="text-[11px] font-bold">,{product.price.split(',')[1]}</small>
          </span>
          <span className="ml-auto w-[34px] h-[34px] rounded-[9px] bg-[var(--red)] text-white flex items-center justify-center">
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

  const gridLabel = activeCategory === ALL_CAT ? 'Todo el catálogo' : MERCHAN_CATEGORIES.find(c => c.id === activeCategory)?.label ?? ''

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-[var(--black)] text-white px-[18px] pt-6 pb-14 overflow-hidden">
        {/* diagonal stripe decoration */}
        <div
          className="absolute -top-[30px] -right-[50px] w-[200px] h-[200px] opacity-[0.07] rotate-[8deg]"
          style={{
            background: 'repeating-linear-gradient(-45deg, #fff 0 14px, #000 14px 28px)',
            clipPath: 'polygon(70px 0, 100% 0, 100% 100%, 0 100%)',
          }}
        />
        <div className="flex items-center gap-2 font-[var(--font-display)] text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--red)]">
          <span className="w-[18px] h-[2px] bg-[var(--red)]" />
          Tienda oficial
        </div>
        <div className="font-[var(--font-display)] font-black text-[40px] leading-[0.92] mt-[10px] uppercase relative z-[1]">
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

      {/* Category chips — sticky */}
      <div className="chips sticky top-[var(--top-h)] z-50 bg-[var(--bg)] pt-4 pb-[6px]">
        <button
          className={`chip ${activeCategory === ALL_CAT ? 'active' : ''}`}
          onClick={() => setActiveCategory(ALL_CAT)}
        >
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

      {/* Grid header */}
      <div className="flex items-baseline justify-between px-4 pt-[14px] pb-[2px]">
        <span className="font-[var(--font-display)] font-extrabold text-[16px] tracking-[0.02em] uppercase">
          {gridLabel}
        </span>
        <span className="text-xs text-[var(--muted)]">{filtered.length} artículos</span>
      </div>

      {/* Product grid */}
      <div key={activeCategory} className="grid grid-cols-2 gap-[10px] px-3 pt-[10px]">
        {filtered.map((product, i) => (
          <ProductCard key={product.url} product={product} index={i} />
        ))}
      </div>

      {/* Store note */}
      <div className="relative mx-3 mt-[18px] mb-2 bg-[var(--black)] rounded-[var(--radius)] px-[17px] py-4 text-white flex items-center gap-[14px] overflow-hidden">
        <div
          className="absolute top-0 right-0 w-[120px] h-full opacity-[0.055] pointer-events-none"
          style={{ background: 'repeating-linear-gradient(-45deg, #fff 0 12px, transparent 12px 24px)' }}
        />
        <div className="w-[42px] h-[42px] rounded-full bg-[var(--red)] flex items-center justify-center flex-shrink-0">
          <IconBag />
        </div>
        <div>
          <b className="font-[var(--font-display)] font-extrabold text-[15px] tracking-[0.04em] uppercase block">
            Pedidos en la tienda oficial
          </b>
          <p className="text-xs text-white/65 mt-[2px] leading-[1.4]">
            El botón Comprar te lleva a la tienda del AD Ceuta FC: mismo precio, pago seguro y todo el beneficio para el club.
          </p>
        </div>
      </div>

      <a
        href={STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-[11px] text-[var(--muted)] underline pb-6 mt-3"
      >
        tienda.adceutafc.com
      </a>
    </div>
  )
}
