'use client';

import Link from 'next/link';
import { Check, ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { useStoreCart } from './cart-provider';

type FloatingCartSummaryProps = {
  slug: string;
  pedidoMinimo: number | null;
  taxaEntrega: number | null;
};

export default function FloatingCartSummary({
  slug,
  pedidoMinimo,
  taxaEntrega,
}: FloatingCartSummaryProps) {
  const { subtotal, totalItems } = useStoreCart();

  if (totalItems === 0) return null;

  const possuiFreteGratis = pedidoMinimo !== null && pedidoMinimo >= 0;

  const freteGratisAtingido =
    possuiFreteGratis && subtotal >= pedidoMinimo;

  const valorRestante = possuiFreteGratis
    ? Math.max(pedidoMinimo - subtotal, 0)
    : 0;

  const progresso = possuiFreteGratis
    ? pedidoMinimo === 0
      ? 100
      : Math.min((subtotal / pedidoMinimo) * 100, 100)
    : 0;

  return (
    <>
      <div aria-hidden="true" className="h-40" />
      <aside className="fixed inset-x-0 bottom-[88px] z-40 px-3">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/${slug}/sacola`}
          aria-label="Ver sacola"
          className="
            block overflow-hidden rounded-[22px]
            border border-zinc-200/80
            bg-white/95
            shadow-[0_10px_35px_rgba(0,0,0,0.12)]
            backdrop-blur-xl
            transition
            active:scale-[0.985]
          "
        >
          {/* Resumo principal */}
          <div className="flex items-center gap-3 p-3">
            {/* Ícone */}
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFFB66]">
              <ShoppingBag className="h-5 w-5 stroke-[2.3] text-zinc-950" />

              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            </div>

            {/* Texto */}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-500">
                {totalItems === 1
                  ? '1 item na sacola'
                  : `${totalItems} itens na sacola`}
              </p>

              <div className="mt-0.5 flex items-baseline gap-2">
                <strong className="text-lg font-extrabold tracking-tight text-zinc-950">
                  {formatCurrency(subtotal)}
                </strong>

                <span className="text-[11px] font-medium text-zinc-400">
                  subtotal
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-zinc-950 px-4 text-sm font-bold text-white">
              Ver sacola
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>

          {/* Frete grátis */}
          {possuiFreteGratis ? (
            <div className="border-t border-zinc-100 px-3 pb-3 pt-2.5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      freteGratisAtingido
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-yellow-100 text-zinc-800'
                    }`}
                  >
                    {freteGratisAtingido ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : (
                      <Truck className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <p
                    className={`truncate text-xs font-semibold ${
                      freteGratisAtingido
                        ? 'text-emerald-700'
                        : 'text-zinc-600'
                    }`}
                  >
                    {freteGratisAtingido
                      ? 'Frete grátis liberado'
                      : `Mais ${formatCurrency(
                          valorRestante,
                        )} para frete grátis`}
                  </p>
                </div>

                {!freteGratisAtingido && (
                  <span className="shrink-0 text-[10px] font-semibold text-zinc-400">
                    {Math.round(progresso)}%
                  </span>
                )}
              </div>

              <div className="h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    freteGratisAtingido
                      ? 'bg-emerald-500'
                      : 'bg-[#F5DF18]'
                  }`}
                  style={{ width: `${progresso}%` }}
                />
              </div>

              {!freteGratisAtingido && taxaEntrega !== null && (
                <p className="mt-1.5 text-[10px] font-medium text-zinc-400">
                  Taxa atual de entrega: {formatCurrency(taxaEntrega)}
                </p>
              )}
            </div>
          ) : taxaEntrega !== null ? (
            <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2.5">
              <Truck className="h-3.5 w-3.5 text-zinc-400" />

              <span className="text-[11px] font-medium text-zinc-500">
                Taxa de entrega {formatCurrency(taxaEntrega)}
              </span>
            </div>
          ) : null}
        </Link>
      </div>
      </aside>
    </>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
