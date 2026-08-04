const pulse = 'animate-pulse rounded-2xl bg-zinc-200/80';

export default function StoreLoading() {
  return (
    <main className="min-h-screen bg-white pb-28" aria-busy="true" aria-label="Carregando loja">
      <header className="border-b border-yellow-200/70 bg-[#FFFB66] px-4 pb-4 pt-5">
        <div className="mx-auto flex max-w-3xl gap-3">
          <div className={`${pulse} h-12 w-12 shrink-0 rounded-full bg-white/70`} />
          <div className={`${pulse} h-14 flex-1 rounded-full bg-white/80`} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        <section className="px-4 pt-5">
          <div className="mb-4 space-y-2">
            <div className={`${pulse} h-3 w-20`} />
            <div className={`${pulse} h-7 w-56`} />
          </div>
          <div className={`${pulse} h-48 w-full rounded-3xl bg-blue-100`} />
        </section>

        <section className="px-4 pt-8">
          <div className="mb-5 space-y-2">
            <div className={`${pulse} h-3 w-16`} />
            <div className={`${pulse} h-7 w-52`} />
          </div>
          <div className="grid grid-cols-3 gap-x-3 gap-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className={`${pulse} aspect-square w-full rounded-[24px]`} />
                <div className={`${pulse} mx-auto h-3 w-4/5`} />
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pt-10">
          <div className="mb-5 space-y-2">
            <div className={`${pulse} h-3 w-28`} />
            <div className={`${pulse} h-7 w-48`} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-zinc-100 p-3">
                <div className={`${pulse} aspect-square w-full`} />
                <div className="mt-3 space-y-2">
                  <div className={`${pulse} h-4 w-full`} />
                  <div className={`${pulse} h-3 w-2/3`} />
                  <div className={`${pulse} mt-4 h-5 w-1/2`} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
