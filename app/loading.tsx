export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <div className="mb-8 h-12 w-full max-w-3xl rounded-2xl shimmer" />
      <div className="grid gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-60 rounded-3xl shimmer" />
        ))}
      </div>
    </main>
  );
}
