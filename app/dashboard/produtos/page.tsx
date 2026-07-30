import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRightIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/server';

type Produto = {
  id: string;
  nome?: string | null;
  marca?: string | null;
  descricao?: string | null;
  preco?: number | string | null;
  preco_promocional?: number | string | null;
  imagem_url?: string | null;
  ativo?: boolean | null;
  estoque?: number | null;
  created_at?: string | null;
};

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export default async function ProdutosPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: loja } = await supabase
    .from('mercados')
    .select('id, nome, slug')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (!loja) {
    return <EmptyStoreState />;
  }

  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('mercado_id', loja.id)
    .order('created_at', { ascending: false });

  const produtosDaLoja = (produtos || []) as Produto[];
  const produtosAtivos = produtosDaLoja.filter(
    (produto) => produto.ativo !== false,
  ).length;
  const produtosInativos = produtosDaLoja.length - produtosAtivos;
  const produtosComEstoqueBaixo = produtosDaLoja.filter((produto) => {
    const estoque = Number(produto.estoque ?? 0);
    return produto.ativo !== false && estoque <= 5;
  }).length;
  const produtosEmOferta = produtosDaLoja.filter((produto) =>
    Boolean(produto.preco_promocional),
  ).length;
  const totalEmEstoque = produtosDaLoja.reduce(
    (total, produto) => total + Number(produto.estoque ?? 0),
    0,
  );
  const percentualAtivos =
    produtosDaLoja.length > 0
      ? Math.round((produtosAtivos / produtosDaLoja.length) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F4] px-3 py-1 text-xs font-semibold text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-[#F4F2FF]" />
            Catálogo
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
            Produtos
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
            Cadastre, revise e acompanhe os itens publicados na vitrine da{' '}
            {loja.nome}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/produtos/novo"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
          >
            Novo produto
            <PlusIcon className="h-4 w-4" />
          </Link>

          <Link
            href={`/${loja.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            Ver loja
            <CursorArrowRaysIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total de produtos"
          value={String(produtosDaLoja.length)}
          description="Itens cadastrados"
          icon={CubeIcon}
        />
        <SummaryCard
          title="Produtos ativos"
          value={String(produtosAtivos)}
          description={`${percentualAtivos}% do catálogo`}
          icon={CheckCircleIcon}
        />
        <SummaryCard
          title="Estoque baixo"
          value={String(produtosComEstoqueBaixo)}
          description="Com 5 unidades ou menos"
          icon={ExclamationTriangleIcon}
        />
        <SummaryCard
          title="Em oferta"
          value={String(produtosEmOferta)}
          description="Com preço promocional"
          icon={TagIcon}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
        <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                Catálogo da loja
              </h2>
              <p className="mt-1 text-sm font-normal text-zinc-400">
                {produtosDaLoja.length === 1
                  ? '1 produto cadastrado'
                  : `${produtosDaLoja.length} produtos cadastrados`}
              </p>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full bg-[#F7F7F4] p-1">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 shadow-sm">
                Todos
              </span>
              <span className="px-3 py-1.5 text-xs font-medium text-zinc-400">
                {produtosAtivos} ativos
              </span>
            </div>
          </div>

          {produtosDaLoja.length > 0 ? (
            <div className="divide-y divide-zinc-100">
              {produtosDaLoja.map((produto) => {
                const estoque = Number(produto.estoque ?? 0);
                const emOferta = Boolean(produto.preco_promocional);

                return (
                  <article
                    key={produto.id}
                    className="grid gap-4 p-5 transition hover:bg-[#FBFBFA] md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-6"
                  >
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F7F7F4] text-zinc-400 ring-1 ring-zinc-200/70">
                        {produto.imagem_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={produto.imagem_url}
                            alt={produto.nome || 'Produto'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ShoppingBagIcon className="h-8 w-8" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-zinc-950 sm:text-base">
                            {produto.nome || 'Produto sem nome'}
                          </h3>
                          <StatusBadge active={produto.ativo !== false} />
                          {emOferta && (
                            <span className="rounded-full bg-[#F4F2FF] px-2.5 py-1 text-[10px] font-semibold text-zinc-950">
                              Oferta
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs font-medium text-zinc-400 sm:text-sm">
                          {produto.marca || 'Produto'} ·{' '}
                          <span
                            className={
                              estoque <= 5 ? 'text-amber-600' : undefined
                            }
                          >
                            {estoque} em estoque
                          </span>
                        </p>

                        {produto.descricao && (
                          <p className="mt-2 line-clamp-1 max-w-2xl text-sm font-normal text-zinc-500">
                            {produto.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 md:justify-end">
                      <div className="text-left md:text-right">
                        <p className="text-base font-bold text-zinc-950">
                          {formatCurrency(
                            produto.preco_promocional || produto.preco,
                          )}
                        </p>
                        {emOferta && (
                          <p className="text-xs font-medium text-zinc-300 line-through">
                            {formatCurrency(produto.preco)}
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/${loja.slug}/${produto.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                        aria-label={`Abrir produto ${produto.nome || produto.id}`}
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4F2FF] text-zinc-950">
                <CubeIcon className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-zinc-950">
                Nenhum produto cadastrado
              </h2>

              <p className="mt-2 max-w-md text-sm font-medium leading-6 text-zinc-400">
                Crie seu primeiro produto para começar a montar o catálogo da
                loja.
              </p>

              <Link
                href="/dashboard/produtos/novo"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black"
              >
                Cadastrar produto
                <PlusIcon className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-[28px] bg-zinc-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  Inventário
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight">
                  {totalEmEstoque}
                </p>
                <p className="mt-1 text-sm font-medium text-zinc-400">
                  unidades disponíveis
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                <ArchiveBoxIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#F4F2FF]"
                style={{ width: `${percentualAtivos}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-medium text-zinc-400">
              <span>Catálogo ativo</span>
              <span>{percentualAtivos}%</span>
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-950">
                  Visibilidade do catálogo
                </h2>
                <p className="text-xs font-normal text-zinc-400">
                  Situação dos seus produtos
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <CatalogRow
                label="Ativos na vitrine"
                value={produtosAtivos}
                tone="dark"
              />
              <CatalogRow
                label="Produtos inativos"
                value={produtosInativos}
              />
              <CatalogRow
                label="Precisam de estoque"
                value={produtosComEstoqueBaixo}
                tone="warning"
              />
              <CatalogRow
                label="Ofertas publicadas"
                value={produtosEmOferta}
                tone="accent"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-950">Loja online</h2>
            <p className="mt-1 truncate text-xs font-normal text-zinc-400">
              lojacomapp.com.br/{loja.slug}
            </p>
            <Link
              href={`/${loja.slug}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F7F7F4] text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Abrir catálogo
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-zinc-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">
            {value}
          </p>
          <p className="mt-2 text-xs font-normal text-zinc-400">
            {description}
          </p>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'rounded-full px-2.5 py-1 text-[10px] font-semibold',
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-zinc-100 text-zinc-500',
      ].join(' ')}
    >
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function CatalogRow({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'dark' | 'warning' | 'accent';
}) {
  const valueClass = {
    neutral: 'bg-zinc-100 text-zinc-600',
    dark: 'bg-zinc-950 text-white',
    warning: 'bg-amber-50 text-amber-700',
    accent: 'bg-[#F4F2FF] text-zinc-950',
  }[tone];

  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#F7F7F4] px-4 py-3">
      <span className="text-sm font-medium text-zinc-600">{label}</span>
      <span
        className={`flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold ${valueClass}`}
      >
        {value}
      </span>
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
            Configure sua loja primeiro
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-zinc-500">
            Antes de cadastrar produtos, crie a loja que vai receber esse
            catálogo.
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
