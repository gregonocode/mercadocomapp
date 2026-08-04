'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Box,
  Building2,
  ChevronDown,
  Gift,
  Home,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  UserRound,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useStoreCart } from '@/app/components/storefront/cart-provider';

export type CategoryProduct = {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  precoOriginal?: number;
  precoUnitario: string;
  imagemUrl: string | null;
  promocao: boolean;
  emEstoque: boolean;
  quantidadeDisponivel: number;
};

type CategoryProductsClientProps = {
  slug: string;
  nomeCategoria: string;
  nomeMercado: string;
  produtos: CategoryProduct[];
};

type FiltroAtivo = 'todos' | 'promocao' | 'estoque';

export default function CategoryProductsClient({
  slug,
  nomeCategoria,
  nomeMercado,
  produtos,
}: CategoryProductsClientProps) {
  const router = useRouter();

  const [pesquisa, setPesquisa] = useState('');
  const [filtroAtivo, setFiltroAtivo] =
    useState<FiltroAtivo>('todos');
  const { items, addItem, setQuantity, totalItems } = useStoreCart();

  const produtosDaCategoria = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return produtos.filter((produto) => {
      const correspondePesquisa =
        !termo ||
        produto.nome.toLowerCase().includes(termo) ||
        produto.descricao.toLowerCase().includes(termo);

      const correspondeFiltro =
        filtroAtivo === 'todos' ||
        (filtroAtivo === 'promocao' && produto.promocao) ||
        (filtroAtivo === 'estoque' && produto.emEstoque);

      return correspondePesquisa && correspondeFiltro;
    });
  }, [produtos, pesquisa, filtroAtivo]);

  function alterarQuantidade(
    produto: CategoryProduct,
    alteracao: number,
  ) {
    const quantidadeAtual =
      items.find((item) => item.id === produto.id)?.quantidade ?? 0;

    if (quantidadeAtual === 0 && alteracao > 0) {
      adicionarProduto(produto);
      return;
    }

    setQuantity(produto.id, quantidadeAtual + alteracao);
  }

  function adicionarProduto(produto: CategoryProduct) {
    if (items.some((item) => item.id === produto.id)) return;

    addItem({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagemUrl: produto.imagemUrl,
      quantidadeDisponivel: produto.quantidadeDisponivel,
    });
  }

  return (
    <main className="min-h-screen bg-white pb-28 text-zinc-950">
      {/* Cabeçalho de pesquisa */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition hover:bg-zinc-100 active:scale-95"
            >
              <ArrowLeft className="h-7 w-7" />
            </button>

            <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-zinc-100 px-5">
              <Search className="h-6 w-6 shrink-0 text-blue-600" />

              <input
                type="search"
                value={pesquisa}
                onChange={(event) =>
                  setPesquisa(event.target.value)
                }
                placeholder={`Pesquisar em ${nomeCategoria}`}
                aria-label={`Pesquisar em ${nomeCategoria}`}
                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-zinc-950 outline-none placeholder:font-normal placeholder:text-zinc-500"
              />

              {pesquisa && (
                <button
                  type="button"
                  onClick={() => setPesquisa('')}
                  aria-label="Limpar pesquisa"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-95"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </label>
          </div>

          {/* Filtros */}
          <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setFiltroAtivo('todos')}
              className={`flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
                filtroAtivo === 'todos'
                  ? 'border-zinc-950 bg-white text-zinc-950'
                  : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  filtroAtivo === 'todos'
                    ? 'bg-[#FFFB00]'
                    : 'bg-zinc-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </span>

              Filtros
            </button>

            <button
              type="button"
              onClick={() => setFiltroAtivo('promocao')}
              className={`flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                filtroAtivo === 'promocao'
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              <Tag className="h-5 w-5" />
              Promoções
            </button>

            <button
              type="button"
              onClick={() => setFiltroAtivo('estoque')}
              className={`flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-semibold transition ${
                filtroAtivo === 'estoque'
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-200 bg-white text-zinc-700'
              }`}
            >
              <Box className="h-5 w-5" />
              Em estoque
            </button>

            <button
              type="button"
              className="flex h-12 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700"
            >
              Mais vendidos
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        {/* Informações da categoria */}
        <section className="px-5 pb-4 pt-7">
          <p className="text-sm text-zinc-500">
            Categoria
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {nomeCategoria}
              </h1>

              <p className="mt-1 text-base text-zinc-700">
                {produtosDaCategoria.length}{' '}
                {produtosDaCategoria.length === 1
                  ? 'produto encontrado'
                  : 'produtos encontrados'}
              </p>
            </div>
          </div>
        </section>

        {/* Lista de produtos */}
        <section>
          {produtosDaCategoria.length > 0 ? (
            produtosDaCategoria.map((produto) => {
              const quantidade =
                items.find((item) => item.id === produto.id)?.quantidade ?? 0;

              return (
                <article
                  key={produto.id}
                  className="border-b border-zinc-200 px-5 py-7"
                >
                  <div className="flex gap-4">
                    {/* Imagem do produto */}
                    <div
                      className="relative flex aspect-square w-[34%] max-w-36 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100"
                    >
                      {produto.imagemUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={produto.imagemUrl}
                          alt={produto.nome}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-50 to-zinc-200 p-3 text-center">
                          <Package className="h-12 w-12 text-zinc-400" />

                          <span className="text-xs font-medium text-zinc-500">
                            Imagem do produto
                          </span>
                        </div>
                      )}

                      {produto.promocao && (
                        <span className="absolute right-2 top-2 rounded-md bg-[#FFFB00] px-2 py-1 text-[10px] font-extrabold uppercase text-black">
                          Oferta
                        </span>
                      )}
                    </div>

                    {/* Informações */}
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-3 text-lg font-medium leading-6 text-zinc-950">
                        {produto.nome}
                      </h2>

                      <p className="mt-1 line-clamp-2 text-sm leading-5 text-zinc-500">
                        {produto.descricao}
                      </p>

                      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <strong className="text-2xl font-bold tracking-tight">
                          {formatarPreco(produto.preco)}
                        </strong>

                        {produto.precoOriginal && (
                          <span className="text-sm text-zinc-400 line-through">
                            {formatarPreco(produto.precoOriginal)}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                        <Building2 className="h-3.5 w-3.5" />

                        <span>
                          Vendido por {nomeMercado}
                        </span>
                      </div>

                      {!produto.emEstoque && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                          Produto sem estoque
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantidade e adicionar */}
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-40 shrink-0 items-center justify-between rounded-full border border-zinc-200 bg-white px-1 shadow-sm">
                      <button
                        type="button"
                        onClick={() =>
                          alterarQuantidade(produto, -1)
                        }
                        disabled={
                          quantidade === 0 ||
                          !produto.emEstoque
                        }
                        aria-label={`Diminuir quantidade de ${produto.nome}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Minus className="h-5 w-5" />
                      </button>

                      <span className="min-w-8 text-center text-lg font-semibold">
                        {quantidade}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          alterarQuantidade(produto, 1)
                        }
                        disabled={!produto.emEstoque}
                        aria-label={`Aumentar quantidade de ${produto.nome}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-950 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                          adicionarProduto(produto)
                      }
                      disabled={!produto.emEstoque}
                      className={`h-12 flex-1 rounded-full text-base font-bold transition active:scale-[0.98] ${
                        produto.emEstoque
                          ? quantidade > 0
                            ? 'bg-[#FFFB66] text-zinc-950'
                            : 'bg-zinc-100 text-zinc-600'
                          : 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                      }`}
                    >
                      {!produto.emEstoque
                        ? 'Indisponível'
                        : quantidade > 0
                          ? 'Adicionado'
                          : 'Adicionar'}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="px-5 py-20 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100">
                <Search className="h-8 w-8 text-zinc-400" />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Nenhum produto encontrado
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Não encontramos produtos nesta categoria com
                os filtros selecionados.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPesquisa('');
                  setFiltroAtivo('todos');
                }}
                className="mt-5 rounded-full bg-[#FFFB66] px-6 py-3 text-sm font-bold"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Menu inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto grid h-[78px] max-w-3xl grid-cols-5 px-3">
          <BottomNavigationItem
            href={`/${slug}`}
            label="Início"
            icon={<Home className="h-6 w-6" />}
          />

          <BottomNavigationItem
            href={`/${slug}/conta`}
            label="Conta"
            icon={<UserRound className="h-6 w-6" />}
          />

          <BottomNavigationItem
            href={`/${slug}/beneficios`}
            label="Benefícios"
            icon={<Gift className="h-6 w-6" />}
          />

          <BottomNavigationItem
            href={`/${slug}/ofertas`}
            label="Ofertas"
            icon={<Tag className="h-6 w-6" />}
          />

          <BottomNavigationItem
            href={`/${slug}/sacola`}
            label="Carrinho"
            icon={<ShoppingCart className="h-6 w-6" />}
            badge={totalItems}
          />
        </div>
      </nav>
    </main>
  );
}

type BottomNavigationItemProps = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

function BottomNavigationItem({
  href,
  label,
  icon,
  badge,
}: BottomNavigationItemProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex flex-col items-center justify-center gap-1 text-zinc-500 transition active:scale-95"
    >
      <div className="relative">
        {icon}

        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FFFB00] px-1 text-[11px] font-extrabold text-zinc-950 ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      <span className="sr-only">{label}</span>
    </Link>
  );
}

function formatarPreco(valor: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}
