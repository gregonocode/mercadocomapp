import { notFound } from 'next/navigation';
import { getMarketBySlug } from '@/app/lib/storefront';
import CartPageClient from './cart-page-client';

export default async function SacolaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) notFound();

  return (
    <CartPageClient
      slug={market.slug}
      marketName={market.nome}
      pedidoMinimo={market.pedido_minimo}
      taxaEntrega={market.taxa_entrega}
    />
  );
}
