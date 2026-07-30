import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Gift,
  Home,
  Menu,
  Search,
  ShoppingCart,
  Tag,
  Truck,
  UserRound,
} from 'lucide-react';
import { getMarketBySlug, getStorefrontHome } from '@/app/lib/storefront';

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

const categoryBackgrounds = [
  'bg-[#FFE4EA]',
  'bg-[#F2E8FF]',
  'bg-[#FFF8D5]',
  'bg-[#DFFCF5]',
  'bg-[#F1F1F1]',
  'bg-[#FFF1E5]',
  'bg-[#E9EFFF]',
  'bg-[#FFE5EE]',
  'bg-[#E4F6FF]',
];

export default async function LojaPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const market = await getMarketBySlug(slug);

  if (!market) {
    notFound();
  }

  const { categories, products } = await getStorefrontHome(market);
  const rawSearch = Array.isArray(query.q) ? query.q[0] : query.q;
  const search = rawSearch?.trim().toLocaleLowerCase('pt-BR') || '';
  const visibleProducts = search
    ? products.filter((product) =>
        [product.nome, product.descricao, product.marca]
          .filter(Boolean)
          .some((value) =>
            value?.toLocaleLowerCase('pt-BR').includes(search),
          ),
      )
    : products;
  const banners = [
    {
      id: market.id,
      titulo: market.nome,
      descricao:
        market.descricao || 'Confira os produtos disponíveis no mercado.',
      imagemUrl: market.banner_url,
    },
  ];

  return (
    <main className="min-h-screen bg-white pb-28 text-zinc-950">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-40 border-b border-yellow-200/70 bg-[#FFFB66]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <button
            type="button"
            aria-label="Abrir menu"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition hover:bg-black/5 active:scale-95"
          >
            <Menu className="h-7 w-7 stroke-[2.5]" />
          </button>

          <form action={`/${market.slug}`} className="min-w-0 flex-1">
            <label className="flex h-14 items-center gap-3 rounded-full bg-white px-5 shadow-sm ring-1 ring-black/5">
              <Search className="h-6 w-6 shrink-0 text-blue-600" />

              <input
                type="search"
                name="q"
                defaultValue={rawSearch}
                placeholder="Pesquisar no mercado"
                aria-label={`Pesquisar produtos em ${market.nome}`}
                className="min-w-0 flex-1 bg-transparent text-base text-zinc-900 outline-none placeholder:text-zinc-500 sm:text-lg"
              />
            </label>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-3xl">
        {/* Banners */}
        <section className="pt-5">
          <div className="mb-3 flex items-center justify-between px-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Destaques
              </p>

              <h1 className="mt-1 text-xl font-bold tracking-tight">
                Confira nossas novidades
              </h1>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-blue-600"
            >
              Ver todas
            </button>
          </div>

          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {banners.map((banner) => (
              <article
                key={banner.id}
                className="relative h-48 min-w-[82%] snap-start overflow-hidden rounded-3xl bg-[#E8F0FF] p-5 sm:min-w-[48%]"
              >
                <div className="relative z-10 max-w-[60%]">
                  <h2 className="text-xl font-extrabold leading-tight text-blue-700">
                    {banner.titulo}
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-zinc-600">
                    {banner.descricao}
                  </p>

                  <button
                    type="button"
                    className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm"
                  >
                    Confira
                  </button>
                </div>

                <div className="absolute bottom-4 right-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border border-black/5 bg-zinc-300/70">
                  {banner.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={banner.imagemUrl}
                      alt={`Banner de ${market.nome}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-center text-xs font-medium text-zinc-500">
                      Imagem
                      <br />
                      do banner
                    </span>
                  )}
                </div>

                <div className="absolute -bottom-12 -right-8 h-32 w-32 rounded-full bg-white/30" />
              </article>
            ))}
          </div>
        </section>

        {/* Categorias */}
        <section className="px-4 pb-3 pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Navegue
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                Categorias de produtos
              </h2>
            </div>

            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-blue-600"
            >
              Ver todas
            </button>
          </div>

          <div className="grid grid-cols-3 gap-x-3 gap-y-6">
            {categories.map((categoria, index) => (
              <Link
                key={categoria.id}
                href={`/${market.slug}/${categoria.id}`}
                className="group min-w-0 text-center"
              >
                <div
                  className={`aspect-square w-full overflow-hidden rounded-[24px] border border-black/[0.03] ${categoryBackgrounds[index % categoryBackgrounds.length]} transition duration-200 group-active:scale-95`}
                >
                  <div className="flex h-full w-full items-center justify-center p-3">
                    {categoria.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={categoria.imagem_url}
                        alt={categoria.nome}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-[72%] w-[72%] items-center justify-center rounded-2xl bg-zinc-300/60">
                        <span className="text-xs font-medium text-zinc-500">
                          Imagem
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <span className="mt-2.5 line-clamp-2 block text-sm font-medium leading-[1.15] text-zinc-900 sm:text-base">
                  {categoria.nome}
                </span>
              </Link>
            ))}
          </div>

          {categories.length === 0 && (
            <p className="rounded-3xl bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
              Este mercado ainda não cadastrou categorias.
            </p>
          )}
        </section>

        {/* Produtos em destaque */}
        <section className="px-4 pb-10 pt-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                Selecionados para você
              </p>

              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                Produtos em destaque
              </h2>
            </div>

            <button
              type="button"
              className="shrink-0 text-sm font-semibold text-blue-600"
            >
              Ver todos
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {visibleProducts.map((produto) => (
              <article
                key={produto.id}
                className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
              >
                <div className="flex aspect-square items-center justify-center overflow-hidden bg-zinc-100">
                  {produto.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-200">
                      <span className="text-xs font-medium text-zinc-500">
                        Imagem
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-bold leading-5">
                    {produto.nome}
                  </h3>

                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                    {produto.descricao}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <strong className="text-base text-zinc-950">
                        {formatCurrency(
                          produto.preco_promocional ?? produto.preco,
                        )}
                      </strong>
                      {produto.preco_promocional !== null && (
                        <p className="text-xs text-zinc-400 line-through">
                          {formatCurrency(produto.preco)}
                        </p>
                      )}
                    </div>

                    <Link
                      href={
                        produto.categoria_id
                          ? `/${market.slug}/${produto.categoria_id}`
                          : `/${market.slug}`
                      }
                      aria-label={`Ver ${produto.nome}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFFB66] transition active:scale-90"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <div className="rounded-3xl bg-zinc-50 px-6 py-12 text-center">
              <h3 className="font-bold text-zinc-900">
                {search
                  ? 'Nenhum produto encontrado'
                  : 'Nenhum produto cadastrado'}
              </h3>
              <p className="mt-2 text-sm text-zinc-500">
                {search
                  ? 'Tente pesquisar usando outro nome.'
                  : 'Os produtos ativos aparecerão aqui.'}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Navegação inferior */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.05)] backdrop-blur-xl">
        <div className="mx-auto grid h-[76px] max-w-3xl grid-cols-5 px-3">
          <BottomNavigationButton
            label="Início"
            icon={<Home className="h-6 w-6" />}
            active
          />

          <BottomNavigationButton
            label="Conta"
            icon={<UserRound className="h-6 w-6" />}
          />

          <BottomNavigationButton
            label="Benefícios"
            icon={<Gift className="h-6 w-6" />}
          />

          <BottomNavigationButton
            label="Ofertas"
            icon={<Tag className="h-6 w-6" />}
          />

          <BottomNavigationButton
            label="Carrinho"
            icon={<Truck className="h-7 w-7" />}
          />
        </div>
      </nav>
    </main>
  );
}

type BottomNavigationButtonProps = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
};

function BottomNavigationButton({
  label,
  icon,
  active = false,
  badge,
}: BottomNavigationButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`relative flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
        active ? 'text-zinc-950' : 'text-zinc-500'
      }`}
    >
      <div className="relative">
        {icon}

        {typeof badge === 'number' && badge > 0 && (
          <span className="absolute -right-3 -top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-300 px-1 text-[11px] font-extrabold text-black ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      <span className="sr-only">{label}</span>

      {active && (
        <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-zinc-950" />
      )}
    </button>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
