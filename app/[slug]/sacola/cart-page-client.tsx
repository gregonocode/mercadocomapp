'use client';

import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useStoreCart } from '@/app/components/storefront/cart-provider';

export default function CartPageClient({
  slug,
  marketName,
  pedidoMinimo,
  taxaEntrega,
}: {
  slug: string;
  marketName: string;
  pedidoMinimo: number | null;
  taxaEntrega: number | null;
}) {
  const { items, subtotal, totalItems, removeItem, setQuantity, clearCart } =
    useStoreCart();
  const freteGratis = pedidoMinimo !== null && subtotal >= pedidoMinimo;
  const taxaAplicada = freteGratis ? 0 : (taxaEntrega ?? 0);
  const totalComEntrega = subtotal + taxaAplicada;

  return (
    <main className="min-h-screen bg-zinc-50 pb-36 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-5">
          <Link
            href={`/${slug}`}
            aria-label="Voltar para a loja"
            className="flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-zinc-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <p className="text-sm text-zinc-500">{marketName}</p>
            <h1 className="text-xl font-extrabold tracking-tight">Sacola</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {items.length === 0 ? (
          <section className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFFB66]">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Sua sacola está vazia</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Adicione produtos para continuar sua compra.
            </p>
            <Link
              href={`/${slug}`}
              className="mt-6 inline-flex h-12 items-center rounded-full bg-zinc-950 px-6 text-sm font-bold text-white"
            >
              Ver produtos
            </Link>
          </section>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-500">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'} na sacola
              </p>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-semibold text-red-600"
              >
                Limpar sacola
              </button>
            </div>

            <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex gap-4 border-b border-zinc-100 p-4 last:border-0"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
                    {item.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imagemUrl}
                        alt={item.nome}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <ShoppingCart className="h-6 w-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-sm font-bold">{item.nome}</h2>
                        <p className="mt-1 text-sm font-semibold">
                          {formatCurrency(item.preco)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remover ${item.nome}`}
                        className="text-zinc-400 transition hover:text-red-600"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex h-9 items-center rounded-full border border-zinc-200 px-1">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantidade - 1)}
                          aria-label={`Diminuir quantidade de ${item.nome}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold">
                          {item.quantidade}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantidade + 1)}
                          disabled={item.quantidade >= item.quantidadeDisponivel}
                          aria-label={`Aumentar quantidade de ${item.nome}`}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 disabled:opacity-35"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <strong className="text-sm">
                        {formatCurrency(item.preco * item.quantidade)}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>

      {items.length > 0 && (
        <aside className="fixed inset-x-0 bottom-0 border-t border-zinc-200 bg-white/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                {taxaAplicada > 0 ? 'Subtotal + entrega' : 'Subtotal'}
              </p>
              {taxaAplicada > 0 && (
                <p className="mt-0.5 text-xs font-medium text-zinc-500">
                  Produtos {formatCurrency(subtotal)} + frete {formatCurrency(taxaAplicada)}
                </p>
              )}
              <p className="text-xl font-extrabold">{formatCurrency(totalComEntrega)}</p>
            </div>
            <Link
              href={`/${slug}/checkout`}
              className="flex h-12 items-center rounded-full bg-[#FFFB66] px-5 text-sm font-extrabold text-zinc-950"
            >
              Finalizar pedido
            </Link>
          </div>
        </aside>
      )}
    </main>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
