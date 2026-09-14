export default function Loading() {
  return <main className="mx-auto w-full max-w-5xl px-4 py-8 min-[375px]:px-5 sm:px-8 sm:py-10 lg:px-10 lg:py-14" role="status" aria-label="Loading learning experience">
    <span className="sr-only">Getting your learning ready.</span>
    <div className="motion-safe:animate-pulse">
      <div className="h-4 w-28 rounded-pill bg-primary-soft" />
      <div className="mt-3 h-8 w-64 max-w-full rounded-control bg-border" />
      <div className="mt-8 h-64 rounded-panel border border-border bg-surface" />
      <div className="mt-4 h-24 rounded-surface border border-border bg-surface" />
    </div>
  </main>;
}
