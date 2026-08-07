export default function Loading() {
  return (
    <div className="px-4 py-6 grid grid-cols-2 gap-3 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-40 rounded-xl bg-ceuta-bg-mid" />
      ))}
    </div>
  )
}
