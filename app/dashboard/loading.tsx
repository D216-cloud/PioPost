export default function DashboardLoading() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block border-r border-[var(--line)] p-5">
        <div className="mb-5 h-9 w-28 rounded-lg shimmer" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-10 w-full rounded-xl shimmer" />
          ))}
        </div>
      </aside>
      <main className="p-6">
        <div className="mb-5 h-11 w-56 rounded-xl shimmer" />
        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <div className="h-72 rounded-3xl shimmer" />
          <div className="h-72 rounded-3xl shimmer" />
        </div>
      </main>
    </div>
  );
}
