function SkeletonProductCard() {
  return (
    <div className="bg-[var(--white)] border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      {/* Imagen producto */}
      <div className="aspect-square w-full animate-pulse bg-[var(--bg-mid)]" />
      <div className="p-3 space-y-2">
        {/* Nombre */}
        <div className="h-[13px] w-3/4 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        <div className="h-[13px] w-1/2 animate-pulse rounded-[3px] bg-[var(--bg-mid)]" />
        {/* Precio */}
        <div className="h-5 w-14 animate-pulse rounded-[4px] bg-[var(--bg-mid)]" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="px-4 pt-4 pb-8">
      {/* Header */}
      <div className="mb-4 h-6 w-32 animate-pulse rounded-[4px] bg-[var(--bg-mid)]" />

      {/* Grid 2 columnas como la página real */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    </div>
  )
}
