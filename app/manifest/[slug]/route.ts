import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { createStoreManifest } from '@/app/lib/pwa/manifests';

type StoreManifestRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type StoreManifestLoja = {
  nome: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
};

export async function GET(
  _request: Request,
  { params }: StoreManifestRouteContext,
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: loja, error } = await supabase
    .from('mercados')
    .select('nome, slug, descricao, logo_url, cor_primaria')
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle<StoreManifestLoja>();

  if (error) {
    throw error;
  }

  if (!loja) {
    return NextResponse.json(
      { error: 'Loja não encontrada' },
      {
        status: 404,
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
        },
      },
    );
  }

  const manifest = createStoreManifest({
    name: loja.nome,
    shortName: loja.nome.slice(0, 12),
    description:
      loja.descricao || `Compre online na ${loja.nome} direto pelo app.`,
    slug: loja.slug,
    themeColor: getSafeManifestColor(loja.cor_primaria),
    iconUrl: loja.logo_url,
  });

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function getSafeManifestColor(color: string | null) {
  if (!color) {
    return '#111827';
  }

  if (/^#[0-9a-f]{6}$/i.test(color) || /^#[0-9a-f]{3}$/i.test(color)) {
    return color;
  }

  return '#111827';
}
