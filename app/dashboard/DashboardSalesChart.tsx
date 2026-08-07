'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Periodo = 'diario' | 'semanal' | 'mensal' | 'anual' | 'todo_tempo';

type VendaPorPeriodo = {
  periodo: Periodo;
  inicioPeriodo: string;
  faturamentoTotal: number;
  totalPedidos: number;
};

const periodos: { value: Periodo; label: string }[] = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'anual', label: 'Anual' },
  { value: 'todo_tempo', label: 'Todo o período' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string, periodo: Periodo) {
  const date = new Date(`${value}T12:00:00`);

  if (periodo === 'anual' || periodo === 'todo_tempo') {
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function fortalezaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  const dates: string[] = [];

  for (let date = start; date <= end; date = addDays(date, 1)) {
    dates.push(date);
  }

  return dates;
}

export default function DashboardSalesChart({
  data,
}: {
  data: VendaPorPeriodo[];
}) {
  const [periodo, setPeriodo] = useState<Periodo>('mensal');
  const chartData = useMemo(() => {
    const hoje = fortalezaDateKey();
    const vendasDiarias = new Map(
      data
        .filter((venda) => venda.periodo === 'diario')
        .map((venda) => [venda.inicioPeriodo, venda]),
    );
    const vendasMensais = new Map(
      data
        .filter((venda) => venda.periodo === 'mensal')
        .map((venda) => [venda.inicioPeriodo, venda]),
    );

    const criarSerieDiaria = (inicio: string) =>
      daysBetween(inicio, hoje).map((inicioPeriodo) => {
        const venda = vendasDiarias.get(inicioPeriodo);

        return {
          inicioPeriodo,
          faturamentoTotal: venda?.faturamentoTotal ?? 0,
          totalPedidos: venda?.totalPedidos ?? 0,
          label: formatDate(inicioPeriodo, periodo),
        };
      });

    if (periodo === 'diario') return criarSerieDiaria(hoje);
    if (periodo === 'semanal') return criarSerieDiaria(addDays(hoje, -6));
    if (periodo === 'mensal') return criarSerieDiaria(`${hoje.slice(0, 7)}-01`);

    if (periodo === 'anual') {
      const ano = hoje.slice(0, 4);
      const mesAtual = Number(hoje.slice(5, 7));

      return Array.from({ length: mesAtual }, (_, index) => {
        const inicioPeriodo = `${ano}-${String(index + 1).padStart(2, '0')}-01`;
        const venda = vendasMensais.get(inicioPeriodo);

        return {
          inicioPeriodo,
          faturamentoTotal: venda?.faturamentoTotal ?? 0,
          totalPedidos: venda?.totalPedidos ?? 0,
          label: formatDate(inicioPeriodo, periodo),
        };
      });
    }

    return [...vendasMensais.values()]
      .sort((a, b) => a.inicioPeriodo.localeCompare(b.inicioPeriodo))
      .map((venda) => ({
        ...venda,
        label: formatDate(venda.inicioPeriodo, periodo),
      }));
  }, [data, periodo]);
  const faturamento = chartData.reduce(
    (total, venda) => total + venda.faturamentoTotal,
    0,
  );

  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950">
            Atividade geral de vendas
          </h2>
          <p className="mt-1 text-sm font-normal text-zinc-400">
            Faturamento do período selecionado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-[#F7F7F4] p-1">
          {periodos.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setPeriodo(item.value)}
              className={[
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                periodo === item.value
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-700',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
          Vendas geradas
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
          {formatCurrency(faturamento)}
        </p>
      </div>

      <div className="mt-5 h-[260px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 12, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardSalesFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#CFC7FF" stopOpacity={0.65} />
                  <stop offset="100%" stopColor="#CFC7FF" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E4E4E7" strokeDasharray="5 7" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A1A1AA', fontSize: 12, fontWeight: 600 }}
                minTickGap={24}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: '#A1A1AA', strokeDasharray: '5 5' }}
                contentStyle={{
                  border: '1px solid #E4E4E7',
                  borderRadius: 16,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                }}
                formatter={(value) => [formatCurrency(Number(value)), 'Faturamento']}
                labelStyle={{ color: '#71717A', fontWeight: 600, marginBottom: 4 }}
              />
              <Area
                type="monotone"
                dataKey="faturamentoTotal"
                stroke="#18181B"
                strokeWidth={3}
                fill="url(#dashboardSalesFill)"
                activeDot={{ r: 5, fill: '#18181B', stroke: '#FFFFFF', strokeWidth: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl bg-[#F7F7F4] px-6 text-center text-sm font-medium text-zinc-400">
            Ainda não há vendas para este período.
          </div>
        )}
      </div>
    </div>
  );
}
