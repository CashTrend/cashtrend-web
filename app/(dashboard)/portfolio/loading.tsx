/** Loading skeleton for the Portfolio page. */
export default function PortfolioLoading() {
  return (
    <div
      className="flex flex-col gap-5 animate-pulse"
      aria-busy="true"
      aria-label="Loading portfolio"
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-surface" />
        <div className="h-8 w-36 rounded-lg bg-surface" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-16 rounded-lg bg-surface" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-surface" />
    </div>
  )
}
