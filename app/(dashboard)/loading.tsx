/**
 * loading.tsx — Next.js route-level loading UI for the dashboard.
 *
 * Rendered by Next.js automatically while the page chunk is being loaded
 * (initial SSR / navigation). Uses the same skeleton layout as the inline
 * skeleton in page.tsx to avoid a visual jump.
 */
export default function DashboardLoading() {
  return (
    <div
      className="flex flex-col gap-6 animate-pulse"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {/* KPI card skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-surface" />
        ))}
      </div>

      {/* Holdings table skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-32 rounded bg-surface" />
        <div className="h-64 rounded-xl bg-surface" />
      </div>
    </div>
  )
}
