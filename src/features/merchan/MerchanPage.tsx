'use client'

import { useState } from 'react'
import { MERCHAN_PRODUCTS, MERCHAN_CATEGORIES, type MerchanProduct } from '@/lib/merchan'

const CATEGORY_ICONS: Record<string, string> = {
  equipaciones: '👕',
  entrenamiento: '⚽',
  paseo: '🧥',
  merchandising: '🛍️',
}

function ProductCard({ product }: { product: MerchanProduct }) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-[var(--surface)] rounded-xl overflow-hidden border border-[var(--border)] active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-square bg-[var(--bg-soft)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="text-xs font-medium text-[var(--text)] leading-snug line-clamp-2 mb-2">
          {product.name}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[var(--red)]">{product.price}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] bg-[var(--bg-soft)] px-2 py-0.5 rounded-full">
            Comprar →
          </span>
        </div>
      </div>
    </a>
  )
}

export default function MerchanPage() {
  const [activeCategory, setActiveCategory] = useState<string>('equipaciones')

  const products = MERCHAN_PRODUCTS.filter(p => p.category === activeCategory)

  return (
    <div className="page-content">
      <div className="sec-header" style={{ paddingBottom: '0' }}>
        <span className="sec-title">Tienda Oficial</span>
        <a
          href="https://tienda.adceutafc.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--text-muted)] underline"
        >
          tienda.adceutafc.com
        </a>
      </div>

      {/* Category tabs */}
      <div className="chips" style={{ paddingTop: '12px', paddingBottom: '4px' }}>
        {MERCHAN_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {CATEGORY_ICONS[cat.id]} {cat.label}
          </button>
        ))}
      </div>

      {/* Products grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {products.map(product => (
          <ProductCard key={product.url} product={product} />
        ))}
      </div>

      <p className="text-center text-[10px] text-[var(--text-muted)] pb-6 px-4">
        Los precios y disponibilidad pueden variar. Haz clic en cualquier producto para comprarlo en la tienda oficial.
      </p>
    </div>
  )
}
