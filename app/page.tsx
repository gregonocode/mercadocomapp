import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-black px-6 text-center text-white">
      <h1 className="text-4xl font-bold tracking-normal sm:text-6xl">
        EM CONSTRUÇÃO
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="flex h-12 min-w-36 items-center justify-center rounded-md border border-white/30 px-6 text-sm font-semibold uppercase transition hover:bg-white hover:text-black"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="flex h-12 min-w-36 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold uppercase text-black transition hover:bg-zinc-200"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
