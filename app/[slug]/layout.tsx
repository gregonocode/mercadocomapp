import type { Metadata, Viewport } from 'next';
import StorePwaInstallPrompt from '@/app/components/pwa/StorePwaInstallPrompt';
import { SystemPwaRegistrar } from '@/app/components/system-pwa-registrar';
import { getMarketBySlug } from '@/app/lib/storefront';

type StoreLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: StoreLayoutProps): Promise<Metadata> {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  if (!market) {
    return {
      title: 'Mercado não encontrado',
    };
  }

  const description =
    market.descricao || `Compre online no ${market.nome}.`;

  return {
    title: market.nome,
    description,
    manifest: `/manifest/${encodeURIComponent(market.slug)}`,
    icons: market.logo_url ? { apple: market.logo_url } : undefined,
    openGraph: {
      title: market.nome,
      description,
      images: market.logo_url ? [market.logo_url] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#FFFB66',
  colorScheme: 'light',
};

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { slug } = await params;
  const market = await getMarketBySlug(slug);

  return (
    <>
      <SystemPwaRegistrar />
      {market && (
        <StorePwaInstallPrompt
          slug={market.slug}
          appName={market.nome}
          iconUrl={market.logo_url}
          themeColor={getSafeThemeColor(market.cor_primaria)}
        />
      )}
      {children}
    </>
  );
}

function getSafeThemeColor(color: string | null) {
  if (color && /^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  return '#FFFB66';
}
