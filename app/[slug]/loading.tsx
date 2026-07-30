import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function StoreLoading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f7f7f8] px-6 text-zinc-950">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-xl shadow-zinc-200/70">
          <ShoppingBagIcon className="h-11 w-11 animate-pulse text-zinc-800" />
        </div>

        <p className="mt-6 text-sm font-black">Abrindo a loja</p>
        <p className="mt-2 text-xs font-semibold text-zinc-400">
          Preparando os produtos para voce...
        </p>

        <div className="mt-6 h-1 w-24 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
