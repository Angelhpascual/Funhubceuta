export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-ceuta-bg-mid" />
      <div className="px-4 py-5 space-y-3">
        <div className="h-6 w-40 rounded-lg bg-ceuta-bg-mid" />
        <div className="h-4 w-24 rounded-lg bg-ceuta-bg-mid" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-ceuta-bg-mid" />
          ))}
        </div>
      </div>
    </div>
  )
}
