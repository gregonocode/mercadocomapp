'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BellAlertIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';

type NewOrder = {
  id: string;
  number: number;
  total: number;
};

export default function NewOrderNotifier({ marketId }: { marketId: string | null }) {
  const [orders, setOrders] = useState<NewOrder[]>([]);
  const soundRef = useRef<HTMLAudioElement>(null);
  const seenOrderIds = useRef(new Set<string>());

  useEffect(() => {
    if (!marketId) return;

    const supabase = createClient();
    let active = true;
    seenOrderIds.current.clear();

    function enqueue(record: Record<string, unknown>, notify = true) {
      if (typeof record.id !== 'string' || seenOrderIds.current.has(record.id)) {
        return;
      }

      const id = record.id;
      seenOrderIds.current.add(id);
      if (!notify) return;

      setOrders(current => [
        ...current,
        {
          id,
          number: Number(record.numero_pedido || 0),
          total: Number(record.valor_total || 0),
        },
      ]);
    }

    async function checkForNewOrders(notify: boolean) {
      const { data } = await supabase
        .from('pedidos')
        .select('id, numero_pedido, valor_total')
        .eq('mercado_id', marketId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!active) return;

      for (const record of (data || []).reverse()) {
        enqueue(record as Record<string, unknown>, notify);
      }
    }

    void checkForNewOrders(false);
    const polling = window.setInterval(() => void checkForNewOrders(true), 10_000);
    const channel = supabase
      .channel(`new-orders:${marketId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pedidos',
          filter: `mercado_id=eq.${marketId}`,
        },
        (payload) => {
          enqueue(payload.new as Record<string, unknown>);
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.clearInterval(polling);
      void supabase.removeChannel(channel);
    };
  }, [marketId]);

  const order = orders[0];
  const close = () => setOrders(current => current.slice(1));

  useEffect(() => {
    if (!order) return;

    const sound = soundRef.current;
    if (!sound) return;

    sound.currentTime = 0;
    void sound.play().catch(() => {
      // Alguns navegadores bloqueiam som até a primeira interação do usuário.
    });
  }, [order]);

  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-order-title"
    >
      <section className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
        <audio ref={soundRef} src="/sons/som_money.mp3" preload="auto" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
            <BellAlertIcon className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="Fechar aviso de novo pedido"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold text-violet-700">Novo pedido</p>
        <h2 id="new-order-title" className="mt-1 text-2xl font-bold tracking-tight">
          Pedido #{order.number}
        </h2>
        <p className="mt-3 text-sm text-zinc-500">Valor do pedido</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-zinc-950">
          {formatCurrency(order.total)}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={close}
            className="h-11 rounded-2xl border border-zinc-200 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Fechar
          </button>
          <Link
            href={`/dashboard/pedidos/${order.id}`}
            onClick={close}
            className="flex h-11 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Ver pedido
          </Link>
        </div>
      </section>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
