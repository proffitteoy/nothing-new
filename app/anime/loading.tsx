export default function AnimeLoading() {
  return (
    <div className="min-h-screen pb-20">
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6 lg:px-10">
        <div
          data-field-obstacle
          className="h-56 animate-pulse rounded-[2rem] border border-[var(--site-line)] bg-[var(--site-surface)] shadow-xl"
        />
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5 lg:gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div data-field-obstacle key={index} className="min-w-0">
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-[var(--site-recess)] shadow-lg sm:rounded-3xl" />
              <div className="mx-auto mt-3 h-3 w-2/3 animate-pulse rounded-full bg-[var(--site-line)]" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
