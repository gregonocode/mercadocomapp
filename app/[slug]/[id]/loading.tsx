const pulse = 'animate-pulse rounded-2xl bg-zinc-200/80';

export default function CategoryLoading() {
  return (
    <main className="min-h-screen bg-white pb-28" aria-busy="true" aria-label="Carregando produtos">
      <header className="border-b border-zinc-100 bg-white px-4 pb-4 pt-5">
        <div className="mx-auto flex max-w-3xl gap-3">
          <div className={`${pulse} h-12 w-12 shrink-0 rounded-full`} />
          <div className={`${pulse} h-14 flex-1 rounded-full`} />
        </div>
        <div className="mx-auto mt-5 flex max-w-3xl gap-3 overflow-hidden">
          {[96, 116, 108].map((width) => (
            <div key={width} className={`${pulse} h-12 shrink-0 rounded-full`} style={{ width }} />
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        <section className="space-y-2 px-5 pb-4 pt-7">
          <div className={`${pulse} h-4 w-20`} />
          <div className={`${pulse} h-8 w-48`} />
          <div className={`${pulse} h-5 w-32`} />
        </section>

        <section>
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="border-b border-zinc-200 px-5 py-6">
              <div className="flex gap-4">
                <div className={`${pulse} aspect-square w-[34%] max-w-36 shrink-0`} />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className={`${pulse} h-5 w-4/5`} />
                  <div className={`${pulse} h-4 w-full`} />
                  <div className={`${pulse} h-4 w-3/5`} />
                  <div className={`${pulse} mt-5 h-7 w-28`} />
                  <div className={`${pulse} h-3 w-24`} />
                </div>
              </div>
              <div className="mt-5 flex gap-4">
                <div className={`${pulse} h-12 w-40 rounded-full`} />
                <div className={`${pulse} h-12 flex-1 rounded-full`} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
