import { notFound } from 'next/navigation';
import { getMarketBySlug } from '@/app/lib/storefront';
import CustomerAccountClient from './customer-account-client';

export default async function CustomerAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) notFound();

  return <CustomerAccountClient slug={market.slug} marketName={market.nome} />;
}
