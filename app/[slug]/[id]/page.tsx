import { notFound } from 'next/navigation';
import {
  getMarketBySlug,
  getStorefrontCategory,
} from '@/app/lib/storefront';
import CategoryProductsClient, {
  type CategoryProduct,
} from './category-products-client';

type CategoryPageProps = {
  params: Promise<{
    slug: string;
    id: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug, id } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) {
    notFound();
  }

  const { category, products } = await getStorefrontCategory(market, id);

  if (!category) {
    notFound();
  }

  const categoryProducts: CategoryProduct[] = products.map((product) => {
    const promotionalPrice = product.preco_promocional;

    return {
      id: product.id,
      nome: product.nome,
      descricao:
        product.descricao ||
        [product.marca, product.unidade].filter(Boolean).join(' • ') ||
        'Produto disponível no mercado.',
      preco: promotionalPrice ?? product.preco,
      precoOriginal: promotionalPrice ? product.preco : undefined,
      precoUnitario: product.unidade || 'unidade',
      imagemUrl: product.imagem_url,
      promocao: promotionalPrice !== null,
      emEstoque: product.estoque > 0,
      quantidadeDisponivel: product.estoque,
    };
  });

  return (
    <CategoryProductsClient
      slug={market.slug}
      nomeCategoria={category.nome}
      nomeMercado={market.nome}
      pedidoMinimo={market.pedido_minimo}
      taxaEntrega={market.taxa_entrega}
      produtos={categoryProducts}
    />
  );
}
