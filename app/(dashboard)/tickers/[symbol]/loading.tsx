/** Loading skeleton for the Ticker detail page. */
export default function TickerDetailLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label="Loading ticker">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface" />
        <div className="flex flex-col gap-2">
          <div className="h-6 w-32 rounded bg-surface" />
          <div className="h-4 w-48 rounded bg-surface" />
        </div>
      </div>
      {/* Tab bar */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-20 rounded-lg bg-surface" />
        ))}
      </div>
      {/* Content */}
      <div className="h-96 rounded-xl bg-surface" />
    </div>
  )
}
