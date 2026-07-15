import Navbar from "../../components/Navbar"

export default function AnimeLoading() {
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 pt-24 sm:px-6 md:pt-28 lg:px-10">
        <div className="h-56 animate-pulse rounded-[2rem] border border-white/50 bg-white/40 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40" />
        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5 lg:gap-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="min-w-0">
              <div className="aspect-[3/4] animate-pulse rounded-2xl bg-white/45 shadow-lg backdrop-blur-xl dark:bg-slate-800/45 sm:rounded-3xl" />
              <div className="mx-auto mt-3 h-3 w-2/3 animate-pulse rounded-full bg-white/55 dark:bg-slate-700/55" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
