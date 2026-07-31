import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  PencilSquareIcon,
  PlusIcon,
  ShoppingBagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/server';
import { ProductCategoryFilter } from './product-category-filter';

const PRODUCTS_PER_PAGE = 20;

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
  categoria_id?: string | null;
  created_at?: string | null;
};

type Categoria = {
  id: string;
  nome: string;
};

type ProdutosPageProps = {
  searchParams: Promise<{
    categoria?: string | string[];
    pagina?: string | string[];
  }>;
};

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value || 0));
}

export default async function ProdutosPage({
  searchParams,
}: ProdutosPageProps) {
  const supabase = await createClient();
  const filters = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: loja } = await supabase
    .from('mercados')
    .select('id, slug')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (!loja) {
    return <EmptyStoreState />;
  }

  const { data: categorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('mercado_id', loja.id)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (categoriasError) {
    throw categoriasError;
  }

  const categoriasDaLoja = (categorias || []) as Categoria[];
  const requestedCategory = getSingleParam(filters.categoria);
  const selectedCategory = categoriasDaLoja.some(
    (categoria) => categoria.id === requestedCategory,
  )
    ? requestedCategory
    : '';
  const requestedPage = Number.parseInt(getSingleParam(filters.pagina), 10);
  const currentPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const rangeStart = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const rangeEnd = rangeStart + PRODUCTS_PER_PAGE - 1;

  let productsQuery = supabase
    .from('produtos')
    .select('*', { count: 'exact' })
    .eq('mercado_id', loja.id)
    .order('created_at', { ascending: false })
    .range(rangeStart, rangeEnd);

  if (selectedCategory) {
    productsQuery = productsQuery.eq('categoria_id', selectedCategory);
  }

  const {
    data: produtos,
    count: productCount,
    error: produtosError,
  } = await productsQuery;

  if (produtosError) {
    throw produtosError;
  }

  const produtosDaLoja = (produtos || []) as Produto[];
  const totalProducts = productCount || 0;
  const totalPages = Math.max(
    1,
    Math.ceil(totalProducts / PRODUCTS_PER_PAGE),
  );

  if (currentPage > totalPages) {
    redirect(getProductsHref(totalPages, selectedCategory));
  }

  const categoryNames = new Map(
    categoriasDaLoja.map((categoria) => [categoria.id, categoria.nome]),
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-1 text-sm font-normal text-zinc-500">
            {totalProducts === 1
              ? '1 produto cadastrado'
              : `${totalProducts} produtos cadastrados`}
          </p>
        </div>

        <Link
          href="/dashboard/produtos/novo"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-black"
        >
          Novo produto
          <PlusIcon className="h-4 w-4" />
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <ProductCategoryFilter
          categories={categoriasDaLoja}
          selectedCategory={selectedCategory}
        />

        {selectedCategory && (
          <Link
            href="/dashboard/produtos"
            className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-950"
          >
            Limpar filtro
          </Link>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
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
                          {produto.categoria_id &&
                            categoryNames.get(produto.categoria_id) && (
                              <>
                                {categoryNames.get(produto.categoria_id)} ·{' '}
                              </>
                            )}
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

                    <div className="flex items-center justify-between gap-4 md:justify-end">
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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled
                          title="Edição em breve"
                          aria-label={`Editar produto ${produto.nome || produto.id}`}
                          className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-400"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled
                          title="Exclusão em breve"
                          aria-label={`Excluir produto ${produto.nome || produto.id}`}
                          className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/${loja.slug}/${produto.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                          aria-label={`Abrir produto ${produto.nome || produto.id}`}
                        >
                          <ArrowRightIcon className="h-4 w-4" />
                        </Link>
                      </div>
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
                {selectedCategory
                  ? 'Nenhum produto nesta categoria'
                  : 'Nenhum produto cadastrado'}
              </h2>

              <p className="mt-2 max-w-md text-sm font-medium leading-6 text-zinc-400">
                {selectedCategory
                  ? 'Escolha outra categoria ou limpe o filtro para ver todos os produtos.'
                  : 'Crie seu primeiro produto para começar a montar o catálogo da loja.'}
              </p>

              {selectedCategory ? (
                <Link
                  href="/dashboard/produtos"
                  className="mt-6 flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Limpar filtro
                </Link>
              ) : (
                <Link
                  href="/dashboard/produtos/novo"
                  className="mt-6 flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Cadastrar produto
                  <PlusIcon className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}
      </section>

      {totalPages > 1 && (
        <nav
          aria-label="Paginação de produtos"
          className="flex items-center justify-between gap-4"
        >
          <PaginationLink
            page={currentPage - 1}
            category={selectedCategory}
            disabled={currentPage <= 1}
            label="Anterior"
            icon={<ChevronLeftIcon className="h-4 w-4" />}
          />

          <p className="text-sm font-medium text-zinc-500">
            Página <span className="font-bold text-zinc-950">{currentPage}</span>{' '}
            de {totalPages}
          </p>

          <PaginationLink
            page={currentPage + 1}
            category={selectedCategory}
            disabled={currentPage >= totalPages}
            label="Próxima"
            icon={<ChevronRightIcon className="h-4 w-4" />}
            iconAfter
          />
        </nav>
      )}
    </div>
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getProductsHref(page: number, category: string) {
  const params = new URLSearchParams();

  if (category) {
    params.set('categoria', category);
  }

  if (page > 1) {
    params.set('pagina', String(page));
  }

  const query = params.toString();
  return `/dashboard/produtos${query ? `?${query}` : ''}`;
}

function PaginationLink({
  page,
  category,
  disabled,
  label,
  icon,
  iconAfter = false,
}: {
  page: number;
  category: string;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  iconAfter?: boolean;
}) {
  const className =
    'flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold';

  if (disabled) {
    return (
      <span className={`${className} border-zinc-100 text-zinc-300`}>
        {!iconAfter && icon}
        {label}
        {iconAfter && icon}
      </span>
    );
  }

  return (
    <Link
      href={getProductsHref(page, category)}
      className={`${className} border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50`}
    >
      {!iconAfter && icon}
      {label}
      {iconAfter && icon}
    </Link>
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
