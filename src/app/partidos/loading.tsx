export default function Loading() {
  return (
    <div className="px-4 py-6 space-y-3 animate-pulse">
      <div className="h-5 w-24 rounded-lg bg-ceuta-bg-mid" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-ceuta-bg-mid" />
      ))}
    </div>
  )
}
