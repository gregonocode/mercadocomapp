//app\dashboard\page.tsx
import Link from 'next/link';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  EllipsisHorizontalIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { Flame, TrendingUp } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/server';
import AnimatedCurrency from './AnimatedCurrency';
import DashboardSalesChart from './DashboardSalesChart';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: loja } = await supabase
    .from('mercados')
    .select('id, nome, slug, logo_url, ativa:ativo')
    .eq('proprietario_id', user?.id)
    .maybeSingle();

  const lojaId = loja?.id;

  const [
    produtosResponse,
    pedidosResponse,
    pedidosNovosResponse,
    pedidosEntreguesResponse,
    pedidosRecentesResponse,
    vendasPorPeriodoResponse,
  ] = await Promise.all([
    lojaId
      ? supabase
          .from('produtos')
          .select('id', { count: 'exact', head: true })
          .eq('mercado_id', lojaId)
      : Promise.resolve({ count: 0 }),

    lojaId
      ? supabase
          .from('pedidos')
          .select('id,total:valor_total,status,created_at', { count: 'exact' })
          .eq('mercado_id', lojaId)
      : Promise.resolve({ count: 0, data: [] }),

    lojaId
      ? supabase
          .from('pedidos')
          .select('id', { count: 'exact', head: true })
          .eq('mercado_id', lojaId)
          .eq('status', 'novo')
      : Promise.resolve({ count: 0 }),

    lojaId
      ? supabase
          .from('pedidos')
          .select('id', { count: 'exact', head: true })
          .eq('mercado_id', lojaId)
          .eq('status', 'entregue')
      : Promise.resolve({ count: 0 }),

    lojaId
      ? supabase
          .from('pedidos')
          .select(
            'id, codigo:numero_pedido, cliente_nome, cliente_telefone, total:valor_total, status, created_at',
          )
          .eq('mercado_id', lojaId)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    lojaId
      ? supabase
          .from('dashboard_vendas_por_periodo')
          .select('periodo,inicio_periodo,faturamento_total,total_pedidos')
          .eq('mercado_id', lojaId)
          .order('inicio_periodo', { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  const totalProdutos = produtosResponse.count || 0;
  const totalPedidos = pedidosResponse.count || 0;
  const pedidosNovos = pedidosNovosResponse.count || 0;
  const pedidosEntregues = pedidosEntreguesResponse.count || 0;
  const pedidos = pedidosResponse.data || [];
  const pedidosRecentes = pedidosRecentesResponse.data || [];
  const vendasPorPeriodo = (vendasPorPeriodoResponse.data || []).map((venda) => ({
    periodo: venda.periodo,
    inicioPeriodo: venda.inicio_periodo,
    faturamentoTotal: Number(venda.faturamento_total || 0),
    totalPedidos: Number(venda.total_pedidos || 0),
  }));

  const faturamento = pedidos.reduce((acc, pedido) => {
    return acc + Number(pedido.total || 0);
  }, 0);

  const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0;

  const pedidosHoje = pedidos.filter((pedido) => {
      const hoje = new Date();
      const dataPedido = new Date(pedido.created_at);

      return (
        dataPedido.getDate() === hoje.getDate() &&
        dataPedido.getMonth() === hoje.getMonth() &&
        dataPedido.getFullYear() === hoje.getFullYear()
      );
    });

  const recebidoHoje = pedidosHoje.reduce(
    (acc, pedido) => acc + Number(pedido.total || 0),
    0,
  );

  if (!loja) {
    return <EmptyStoreState />;
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F4] px-3 py-1 text-xs font-semibold text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-[#F4F2FF]" />
            Overview
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
            Boa tarde, {loja.nome}
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
            Acompanhe as vendas, pedidos recentes e principais números da sua
            loja virtual.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/produtos/novo"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Novo produto
            <ArrowRightIcon className="h-4 w-4" />
          </Link>

          <Link
            href={`/${loja.slug}`}
            target="_blank"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Ver loja
            <CursorArrowRaysIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.65fr]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard
              title="Faturamento total"
              value={faturamento}
              description="Total registrado em pedidos"
              icon={TrendingUp}
              trend="+8.0%"
            />

            <MetricCard
              title="Ticket médio"
              value={ticketMedio}
              description="Média por pedido recebido"
              icon={Flame}
              trend="+2.0%"
            />
          </div>

          <DashboardSalesChart data={vendasPorPeriodo} />

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                  Pedidos recentes
                </h2>
                <p className="mt-1 text-sm font-normal text-zinc-400">
                  Últimos pedidos recebidos na sua loja.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/pedidos"
                  className="hidden h-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 sm:flex"
                >
                  Ver todos
                </Link>

                <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500">
                  <EllipsisHorizontalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200">
              {pedidosRecentes.length > 0 ? (
                <div>
                  <div className="hidden grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr] border-b border-zinc-200 bg-[#F7F7F4] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400 md:grid">
                    <span>Cliente</span>
                    <span>Data</span>
                    <span>Valor</span>
                    <span>Status</span>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {pedidosRecentes.map((pedido) => (
                      <Link
                        key={pedido.id}
                        href={`/dashboard/pedidos/${pedido.id}`}
                        className="grid gap-3 bg-white p-4 transition hover:bg-zinc-50 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr] md:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-xs font-semibold text-zinc-950">
                            {(pedido.cliente_nome || 'C')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-950">
                              {pedido.cliente_nome || 'Cliente'}
                            </p>
                            <p className="mt-0.5 text-xs font-normal text-zinc-400">
                              {pedido.codigo || pedido.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-zinc-500">
                          {formatDate(pedido.created_at)}
                        </p>

                        <p className="text-sm font-semibold text-zinc-950">
                          {formatCurrency(Number(pedido.total || 0))}
                        </p>

                        <StatusBadge status={pedido.status} />
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-900">
                    <ShoppingCartIcon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-zinc-950">
                    Nenhum pedido ainda
                  </h3>

                  <p className="mt-2 max-w-sm text-sm font-medium leading-6 text-zinc-400">
                    Quando seus clientes fizerem pedidos, eles vão aparecer
                    aqui.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start xl:overflow-y-auto xl:pr-1">
          <div className="min-h-64 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Resumo rápido
            </p>

            <div className="hidden mt-4 grid grid-cols-2 gap-3">
              <MiniStat
                title="Pedidos"
                value={String(totalPedidos)}
                icon={ShoppingCartIcon}
              />

              <MiniStat
                title="Produtos"
                value={String(totalProdutos)}
                icon={CubeIcon}
              />

              <MiniStat
                title="Novos"
                value={String(pedidosNovos)}
                icon={SparklesIcon}
              />

              <MiniStat
                title="Entregues"
                value={String(pedidosEntregues)}
                icon={CheckCircleIcon}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-950">
                Loja online
              </h2>

              <span
                className={[
                  'rounded-full px-3 py-1 text-xs font-semibold',
                  loja.ativa
                    ? 'bg-[#F4F2FF] text-zinc-950'
                    : 'bg-zinc-100 text-zinc-500',
                ].join(' ')}
              >
                {loja.ativa ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            <div className="mt-5 rounded-3xl bg-[#F7F7F4] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                  {loja.logo_url ? (
                    <img
                      src={loja.logo_url}
                      alt={`Logo da ${loja.nome}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
                      <ShoppingBagIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-950">
                    {loja.nome}
                  </p>

                  <p className="truncate text-xs font-normal text-zinc-400">
                    /{loja.slug}
                  </p>
                </div>
              </div>

              <Link
                href={`/${loja.slug}`}
                target="_blank"
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-black"
              >
                Abrir loja
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-950">
              Hoje recebido
            </h2>

            <p className="mt-4 text-3xl font-bold tracking-tight text-zinc-950">
              {formatCurrency(recebidoHoje)}
            </p>

            <div className="mt-5 h-20 rounded-3xl bg-[#F7F7F4] px-4 py-2">
              <MiniSparkline
                orders={pedidosHoje.map((pedido) => ({
                  createdAt: pedido.created_at,
                  total: Number(pedido.total || 0),
                }))}
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
                <ClockIcon className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-zinc-950">
                  Próximos passos
                </h2>
                <p className="text-xs font-normal text-zinc-400">
                  Configure o essencial
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <ChecklistItem checked={totalProdutos > 0}>
                Cadastrar primeiro produto
              </ChecklistItem>

              <ChecklistItem checked={Boolean(loja.slug)}>
                Definir link da loja
              </ChecklistItem>

              <ChecklistItem checked={loja.ativa}>
                Loja ativa para vendas
              </ChecklistItem>

              <ChecklistItem checked={false}>
                Configurar entrega
              </ChecklistItem>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function EmptyStoreState() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-3xl items-center justify-center">
      <div className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#F4F2FF] to-transparent" />

        <div className="relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4F2FF] text-zinc-950">
            <ShoppingBagIcon className="h-8 w-8" />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-zinc-950">
            Crie sua primeira loja
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-zinc-500">
            Antes de começar a cadastrar produtos, configure o nome, link e
            visual da sua loja online.
          </p>

          <Link
            href="/dashboard/configuracoes"
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 text-sm font-semibold text-white transition hover:bg-black"
          >
            Configurar loja
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-500">{title}</p>

          <p className="mt-3 truncate text-3xl font-bold tracking-tight text-zinc-950">
            <AnimatedCurrency value={value} />
          </p>

          <p className="mt-3 text-xs font-normal text-zinc-400">
            {description}
          </p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-5 inline-flex rounded-full bg-[#F7F7F4] px-3 py-1 text-xs font-semibold text-zinc-950">
          ↑ {trend}
        </div>
      )}
    </div>
  );
}

function MiniStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-[#F7F7F4] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-zinc-950 shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <p className="mt-4 text-2xl font-black tracking-tight text-zinc-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-bold text-zinc-400">{title}</p>
    </div>
  );
}

function MiniSparkline({
  orders,
}: {
  orders: { createdAt: string; total: number }[];
}) {
  const salesByHour = Array.from({ length: 24 }, () => 0);

  orders.forEach((order) => {
    const hour = Number(
      new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Fortaleza',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(order.createdAt)),
    );

    if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
      salesByHour[hour] += order.total;
    }
  });

  const highestSale = Math.max(...salesByHour);
  const points = salesByHour.map((sale, hour) => ({
    x: 5 + (hour / 23) * 210,
    y: highestSale > 0 ? 39 - (sale / highestSale) * 28 : 28,
  }));
  const path =
    highestSale === 0
      ? 'M5 28 H215'
      : points.reduce(
          (value, point, index) => {
            if (index === 0) return `M${point.x} ${point.y}`;
            const previousPoint = points[index - 1];
            const midpointX = (previousPoint.x + point.x) / 2;
            const midpointY = (previousPoint.y + point.y) / 2;

            return `${value} Q${previousPoint.x} ${previousPoint.y} ${midpointX} ${midpointY}`;
          },
          '',
        ) + ` L${points[23].x} ${points[23].y}`;

  return (
    <svg viewBox="0 0 220 58" className="h-full w-full" aria-label="Vendas por hora de hoje">
      <path
        d={path}
        fill="none"
        stroke="#18181B"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <text x="5" y="55" fontSize="10" fontWeight="700" fill="#A1A1AA">
        00:00
      </text>
      <text x="215" y="55" textAnchor="end" fontSize="10" fontWeight="700" fill="#A1A1AA">
        23:00
      </text>
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    novo: 'Novo',
    aguardando_pagamento: 'Aguardando',
    pago: 'Pago',
    em_separacao: 'Separação',
    enviado: 'Enviado',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  const active = status === 'novo' || status === 'pago' || status === 'entregue';

  return (
    <span
      className={[
        'inline-flex w-fit items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold',
        active
          ? 'bg-[#F4F2FF] text-zinc-950'
          : 'bg-zinc-100 text-zinc-500',
      ].join(' ')}
    >
      {label[status] || status}
    </span>
  );
}

function ChecklistItem({
  children,
  checked,
}: {
  children: React.ReactNode;
  checked: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-[#F7F7F4] px-3 py-3">
      <div
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
          checked
            ? 'border-zinc-950 bg-zinc-950 text-white'
            : 'border-zinc-200 bg-white text-transparent',
        ].join(' ')}
      >
        <CheckCircleIcon className="h-3.5 w-3.5" />
      </div>

      <p
        className={[
          'text-sm font-medium',
          checked ? 'text-zinc-900' : 'text-zinc-500',
        ].join(' ')}
      >
        {children}
      </p>
    </div>
  );
}
