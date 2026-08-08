import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import ConcluirPedidosEnviadosButton from './concluir-pedidos-enviados-button';

const ORDERS_PER_PAGE = 10;
const orderFilters = ['todos', 'pendentes', 'aceitos', 'enviados', 'concluidos'] as const;
type OrderFilter = (typeof orderFilters)[number];

const labels: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Aceito',
  em_separacao: 'Em separação',
  pronto: 'Pronto',
  saiu_para_entrega: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

type PedidosPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    pagina?: string | string[];
  }>;
};

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  await connection();
  const supabase = await createClient();
  const filters = await searchParams;
  const requestedStatus = getOrderFilter(getSingleParam(filters.status));
  let status: OrderFilter = requestedStatus ?? 'todos';
  const requestedPage = Number.parseInt(getSingleParam(filters.pagina), 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const rangeStart = (currentPage - 1) * ORDERS_PER_PAGE;
  const rangeEnd = rangeStart + ORDERS_PER_PAGE - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: loja } = await supabase
    .from('mercados')
    .select('id')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (!loja) redirect('/dashboard/configuracoes');

  if (!requestedStatus) {
    const { count: pendingOrderCount, error: pendingOrdersError } =
      await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .eq('mercado_id', loja.id)
        .eq('status', 'pendente');

    if (pendingOrdersError) throw pendingOrdersError;
    if ((pendingOrderCount ?? 0) > 0) status = 'pendentes';
  }

  let query = supabase
    .from('pedidos')
    .select(
      'id,numero_pedido,cliente_nome,cliente_telefone,valor_total,status,tipo_entrega,forma_pagamento,created_at',
      { count: 'exact' },
    )
    .eq('mercado_id', loja.id)
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  switch (status) {
    case 'pendentes':
      query = query.eq('status', 'pendente');
      break;
    case 'aceitos':
      query = query.in('status', ['confirmado', 'em_separacao', 'pronto']);
      break;
    case 'enviados':
      query = query.eq('status', 'saiu_para_entrega');
      break;
    case 'concluidos':
      query = query.eq('status', 'entregue');
      break;
  }

  const { data: pedidos, count: orderCount, error } = await query;

  if (error) throw error;

  const totalOrders = orderCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ORDERS_PER_PAGE));

  if (currentPage > totalPages) {
    redirect(getOrdersHref(totalPages, status));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Acompanhe e gerencie os pedidos da loja.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {[
          ['todos', 'Todos'],
          ['pendentes', 'Pendentes'],
          ['aceitos', 'Aceitos'],
          ['enviados', 'Enviados'],
          ['concluidos', 'Concluídos'],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={getOrdersHref(1, value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              status === value
                ? 'bg-zinc-950 text-white'
                : 'bg-white text-zinc-600 ring-1 ring-zinc-200'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {status === 'enviados' && (pedidos?.length ?? 0) > 1 && (
        <ConcluirPedidosEnviadosButton orderCount={totalOrders} />
      )}

      {status === 'aceitos' && (pedidos?.length ?? 0) > 1 && (
        <ConcluirPedidosEnviadosButton orderCount={totalOrders} action="enviar" />
      )}

      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">
        {pedidos?.length ? (
          pedidos.map((pedido) => (
            <Link
              key={pedido.id}
              href={`/dashboard/pedidos/${pedido.id}`}
              className="flex items-center justify-between gap-4 border-b border-zinc-100 p-5 last:border-0 hover:bg-zinc-50"
            >
              <div>
                <p className="font-bold">Pedido #{pedido.numero_pedido}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {pedido.cliente_nome} · {pedido.tipo_entrega}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(Number(pedido.valor_total))}
                </p>
                <span className="text-xs font-semibold text-zinc-500">
                  {labels[pedido.status] || pedido.status}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <p className="p-12 text-center text-sm text-zinc-500">
            Nenhum pedido encontrado.
          </p>
        )}
      </section>

      {totalPages > 1 && (
        <nav
          aria-label="Paginação de pedidos"
          className="flex items-center justify-between gap-4"
        >
          <PaginationLink
            page={currentPage - 1}
            status={status}
            disabled={currentPage <= 1}
            label="Anterior"
          />

          <p className="text-sm font-medium text-zinc-500">
            Página <span className="font-bold text-zinc-950">{currentPage}</span>{' '}
            de {totalPages}
          </p>

          <PaginationLink
            page={currentPage + 1}
            status={status}
            disabled={currentPage >= totalPages}
            label="Próxima"
          />
        </nav>
      )}
    </div>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getOrderFilter(value: string): OrderFilter | null {
  return orderFilters.includes(value as (typeof orderFilters)[number])
    ? (value as OrderFilter)
    : null;
}

function getOrdersHref(page: number, status: string) {
  const params = new URLSearchParams();

  params.set('status', status);
  if (page > 1) params.set('pagina', String(page));

  const query = params.toString();
  return `/dashboard/pedidos${query ? `?${query}` : ''}`;
}

function PaginationLink({
  page,
  status,
  disabled,
  label,
}: {
  page: number;
  status: string;
  disabled: boolean;
  label: string;
}) {
  const className =
    'flex h-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold';

  if (disabled) {
    return <span className={`${className} border-zinc-100 text-zinc-300`}>{label}</span>;
  }

  return (
    <Link
      href={getOrdersHref(page, status)}
      className={`${className} border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50`}
    >
      {label}
    </Link>
  );
}
