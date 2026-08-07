'use client';

import Link from 'next/link';
import { QrCodeIcon } from '@heroicons/react/24/outline';
import { FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { FiMapPin, FiPhone } from 'react-icons/fi';
import { SiPix } from 'react-icons/si';
import { useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

const labels: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Aceito',
  em_separacao: 'Em separação',
  pronto: 'Pronto',
  saiu_para_entrega: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

type Pedido = {
  id: string;
  numero_pedido: number;
  status: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_entrega: 'delivery' | 'retirada';
  forma_pagamento: string;
  taxa_entrega: number;
  valor_total: number;
  endereco_rua: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_estado: string | null;
  endereco_latitude: number | null;
  endereco_longitude: number | null;
};

type PedidoItem = {
  id: string;
  quantidade: number;
  produto_nome: string;
  subtotal: number;
};

type Props = {
  pedido: Pedido;
  itens: PedidoItem[];
  pixKey: string | null;
  pixName: string | null;
};

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

function getMapsUrl(pedido: Pedido) {
  if (
    pedido.tipo_entrega !== 'delivery' ||
    pedido.endereco_latitude === null ||
    pedido.endereco_longitude === null
  ) {
    return null;
  }

  const destination = `${pedido.endereco_latitude},${pedido.endereco_longitude}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function getQrCodeUrl(value: string) {
  const params = new URLSearchParams({
    size: '220x220',
    data: value,
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function PaymentIcon({ payment }: { payment: string }) {
  if (payment === 'pix') {
    return <SiPix className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
  }

  if (payment === 'cartao_entrega' || payment === 'cartao') {
    return <FaCreditCard className="h-5 w-5 text-blue-600" aria-hidden="true" />;
  }

  return <FaMoneyBillWave className="h-5 w-5 text-emerald-700" aria-hidden="true" />;
}

function paymentLabel(payment: string) {
  if (payment === 'pix') return 'Pix';
  if (payment === 'cartao_entrega' || payment === 'cartao') return 'Cartão na entrega';
  if (payment === 'dinheiro') return 'Dinheiro';
  return payment;
}

export default function PedidoDetailsClient({
  pedido: initialPedido,
  itens,
  pixKey,
  pixName,
}: Props) {
  const [pedido, setPedido] = useState(initialPedido);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const action =
    pedido.status === 'pendente'
      ? ['confirmado', 'Aceitar pedido', 'confirmado_em']
      : pedido.status === 'confirmado' ||
          pedido.status === 'em_separacao' ||
          pedido.status === 'pronto'
        ? ['saiu_para_entrega', 'Enviar pedido', 'saiu_entrega_em']
        : pedido.status === 'saiu_para_entrega'
          ? ['entregue', 'Marcar como entregue', 'entregue_em']
          : null;
  const mapsUrl = getMapsUrl(pedido);
  const subtotalProdutos = itens.reduce(
    (total, item) => total + Number(item.subtotal || 0),
    0,
  );
  const taxaEntrega = Number(pedido.taxa_entrega || 0);

  async function update() {
    if (!action) return;

    setLoading(true);
    const { error: updateError } = await createClient()
      .from('pedidos')
      .update({
        status: action[0],
        [action[2]]: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedido.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPedido((current) => ({ ...current, status: action[0] }));
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/pedidos"
        className="text-sm font-semibold text-zinc-500"
      >
        ← Pedidos
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-zinc-500">Pedido #{pedido.numero_pedido}</p>
          <h1 className="text-3xl font-bold">
            {labels[pedido.status] || pedido.status}
          </h1>
        </div>

        {action && (
          <button
            type="button"
            onClick={update}
            disabled={loading}
            className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {loading ? 'Salvando...' : action[1]}
          </button>
        )}
      </header>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Itens</h2>
          {itens.map((item) => (
            <div
              key={item.id}
              className="mt-4 flex justify-between border-t pt-4 text-sm"
            >
              <span>
                {item.quantidade}× {item.produto_nome}
              </span>
              <b>{money(item.subtotal)}</b>
            </div>
          ))}
          <div className="mt-5 space-y-2 border-t pt-4 text-sm">
            <p className="flex justify-between text-zinc-500">
              <span>Produtos</span>
              <span>{money(subtotalProdutos)}</span>
            </p>
            <p className="flex justify-between text-zinc-500">
              <span>Entrega</span>
              <span>
                {pedido.tipo_entrega === 'retirada'
                  ? 'Retirada no mercado'
                  : taxaEntrega > 0
                    ? money(taxaEntrega)
                    : 'Grátis'}
              </span>
            </p>
            <p className="flex justify-between border-t pt-3 text-lg font-bold text-zinc-950">
              <span>Total</span>
              <span>{money(pedido.valor_total)}</span>
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="font-bold">Cliente e entrega</h2>
          <p className="mt-3">{pedido.cliente_nome}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
            <FiPhone className="h-4 w-4 flex-none" aria-hidden="true" />
            {pedido.cliente_telefone}
          </p>
          <div className="mt-4 flex items-start gap-2">
            <FiMapPin
              className="mt-0.5 h-4 w-4 flex-none text-zinc-500"
              aria-hidden="true"
            />
            <p className="text-sm">
            {pedido.tipo_entrega === 'retirada'
              ? 'Retirada no mercado'
              : `${pedido.endereco_rua}, ${pedido.endereco_numero} — ${pedido.endereco_bairro}, ${pedido.endereco_cidade}/${pedido.endereco_estado}`}
            </p>
          </div>

          {mapsUrl && (
            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start gap-3">
                <QrCodeIcon className="h-6 w-6 flex-none text-zinc-700" />
                <div>
                  <h3 className="font-semibold">Rota de entrega</h3>
                  <p className="mt-1 text-sm leading-5 text-zinc-500">
                    Aponte a camera para abrir a rota deste pedido no Google Maps.
                  </p>
                </div>
              </div>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mx-auto mt-4 block w-fit rounded-xl bg-white p-2 shadow-sm"
                aria-label="Abrir rota no Google Maps"
              >
                <img
                  src={getQrCodeUrl(mapsUrl)}
                  width={220}
                  height={220}
                  alt="QR Code para abrir a rota de entrega no Google Maps"
                />
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Abrir rota no Google Maps
              </a>
            </div>
          )}

          <h2 className="mt-6 font-bold">Pagamento</h2>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium">
            <PaymentIcon payment={pedido.forma_pagamento} />
            {paymentLabel(pedido.forma_pagamento)}
          </p>
          {pedido.forma_pagamento === 'pix' && (
            <p className="mt-2 text-sm text-zinc-500">
              {pixName}
              <br />
              {pixKey}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
