import { notFound } from 'next/navigation';
import { getMarketBySlug } from '@/app/lib/storefront';
import CheckoutClient from './checkout-client';

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) notFound();

  return <CheckoutClient slug={market.slug} marketId={market.id} marketName={market.nome} pedidoMinimo={market.pedido_minimo} taxaEntrega={market.taxa_entrega} marketAddress={{ cep: market.cep, cidade: market.cidade, estado: market.estado }} />;
}
