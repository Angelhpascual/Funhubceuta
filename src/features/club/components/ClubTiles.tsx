export function Tile({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-h-[100px] flex-col justify-between rounded-[14px] p-4 bg-ceuta-bg-soft ${className}`}>
      {children}
    </div>
  )
}

export function TileValue({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`font-display font-black leading-none tracking-tight ${className}`}>{children}</div>
}

export function TileLabel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`mt-2 font-display text-[9px] font-bold uppercase tracking-widest ${className}`}>{children}</div>
}
