'use client';

import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { concluirPedidosEnviados, enviarPedidosAceitos } from './actions';

export default function ConcluirPedidosEnviadosButton({
  orderCount,
  action = 'concluir',
}: {
  orderCount: number;
  action?: 'concluir' | 'enviar';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setError('');
    const result =
      action === 'enviar'
        ? await enviarPedidosAceitos()
        : await concluirPedidosEnviados();
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        {action === 'enviar' ? 'Enviar todos' : 'Marcar todos como concluídos'}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bulk-complete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-sm"
        >
          <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="bulk-complete-title" className="mt-4 text-xl font-extrabold">
              {action === 'enviar'
                ? 'Enviar todos os pedidos aceitos?'
                : 'Concluir pedidos enviados?'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {action === 'enviar'
                ? `Os ${orderCount} pedidos aceitos serão marcados como enviados.`
                : `Os ${orderCount} pedidos exibidos como enviados serão marcados como concluídos.`}
            </p>
            {error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-full px-5 py-3 text-sm font-bold text-zinc-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loading
                  ? action === 'enviar'
                    ? 'Enviando...'
                    : 'Concluindo...'
                  : action === 'enviar'
                    ? 'Confirmar e enviar'
                    : 'Confirmar e concluir'}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
