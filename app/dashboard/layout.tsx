import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import {
  BellIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { SystemPwaRegistrar } from '@/app/components/system-pwa-registrar';
import { createClient } from '@/app/lib/supabase/server';
import {
  DashboardMobileNavigation,
  DashboardNavigation,
} from './DashboardNavigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const nomeUsuario =
    user.user_metadata?.nome ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Lojista';

  const iniciais = nomeUsuario
    .split(' ')
    .map((parte: string) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-zinc-950">
      <SystemPwaRegistrar />
      <div className="flex min-h-screen">
        <aside className="hidden w-[272px] shrink-0 border-r border-zinc-800 bg-[#0A0A0A] px-3 py-4 text-white lg:block">
          <div className="flex h-full flex-col">
            <Link href="/dashboard" className="flex items-center gap-3 px-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-700">
                <Image
                  src="/icon/icon-512.png"
                  alt="Logo da lojacomapp"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0">
                <p className="text-base font-black tracking-tight">
                  lojacomapp
                </p>
                <p className="text-xs font-semibold text-zinc-400">
                  Painel do lojista
                </p>
              </div>
            </Link>

            <div className="mt-6 px-1">
              <div className="flex h-11 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-zinc-500" />
                <input
                  placeholder="Buscar no painel..."
                  className="h-full w-full bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-500"
                />
              </div>
            </div>

            <div className="mt-7 px-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Principal
              </p>
            </div>

            <DashboardNavigation />

          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden border-b border-zinc-200 bg-white/90 px-6 py-4 backdrop-blur-xl lg:block">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-11 w-full max-w-md items-center gap-3 rounded-full border border-zinc-200 bg-[#F7F7F4] px-4">
                  <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
                  <input
                    placeholder="Search Anything ..."
                    className="h-full w-full bg-transparent text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#CFC7FF] ring-2 ring-white" />
                </button>

                <button className="flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 transition hover:bg-zinc-50">
                  PT
                  <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                </button>

                <Link
                  href="/dashboard/configuracoes"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>

                <div className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white py-1 pl-2 pr-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-black text-white">
                    {iniciais}
                  </div>

                  <div className="hidden min-w-0 sm:block">
                    <p className="max-w-[150px] truncate text-sm font-bold leading-4 text-zinc-950">
                      {nomeUsuario}
                    </p>
                    <p className="text-[11px] font-semibold text-zinc-400">
                      Admin
                    </p>
                  </div>

                  <ChevronDownIcon className="h-4 w-4 text-zinc-400" />
                </div>
              </div>
            </div>
          </header>

          <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[#F4F2FF] ring-1 ring-zinc-200/70">
                  <Image
                    src="/icon/icon-512.png"
                    alt="Logo da lojacomapp"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div>
                  <p className="text-sm font-black tracking-tight">
                    lojacomapp
                  </p>
                  <p className="text-xs font-semibold text-zinc-400">
                    Dashboard
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <button className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700">
                  <BellIcon className="h-5 w-5" />
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#CFC7FF] ring-2 ring-white" />
                </button>

                <Link
                  href="/dashboard/configuracoes"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>

            <div className="mt-4 flex h-11 items-center gap-3 rounded-full border border-zinc-200 bg-[#F7F7F4] px-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-zinc-400" />
              <input
                placeholder="Buscar..."
                className="h-full w-full bg-transparent text-sm font-medium text-zinc-800 outline-none placeholder:text-zinc-400"
              />
            </div>

            <DashboardMobileNavigation />
          </header>

          <main className="flex-1 px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
