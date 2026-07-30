import 'server-only';

import { cache } from 'react';
import { createClient } from '@/app/lib/supabase/server';

export type StorefrontMarket = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
  banner_url: string | null;
};

export type StorefrontCategory = {
  id: string;
  mercado_id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  ordem: number;
};

export type StorefrontProduct = {
  id: string;
  mercado_id: string;
  categoria_id: string | null;
  nome: string;
  descricao: string | null;
  marca: string | null;
  preco: number;
  preco_promocional: number | null;
  imagem_url: string | null;
  estoque: number;
  unidade: string | null;
  destaque: boolean;
};

export const getMarketBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('mercados')
    .select(
      'id, nome, slug, descricao, logo_url, cor_primaria, banner_url',
    )
    .eq('slug', slug)
    .eq('ativo', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar o mercado: ${error.message}`);
  }

  return data as StorefrontMarket | null;
});

export async function getStorefrontHome(market: StorefrontMarket) {
  const supabase = await createClient();
  const [categoriesResponse, productsResponse] = await Promise.all([
    supabase
      .from('categorias')
      .select(
        'id, mercado_id, nome, slug, descricao, imagem_url, ordem',
      )
      .eq('mercado_id', market.id)
      .eq('ativo', true)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true }),
    supabase
      .from('produtos')
      .select(
        'id, mercado_id, categoria_id, nome, descricao, marca, preco, preco_promocional, imagem_url, estoque, unidade, destaque',
      )
      .eq('mercado_id', market.id)
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('nome', { ascending: true })
      .limit(24),
  ]);

  if (categoriesResponse.error) {
    throw new Error(
      `Não foi possível carregar as categorias: ${categoriesResponse.error.message}`,
    );
  }

  if (productsResponse.error) {
    throw new Error(
      `Não foi possível carregar os produtos: ${productsResponse.error.message}`,
    );
  }

  return {
    categories: categoriesResponse.data as StorefrontCategory[],
    products: productsResponse.data.map(normalizeProduct),
  };
}

export async function getStorefrontCategory(
  market: StorefrontMarket,
  categoryId: string,
) {
  const supabase = await createClient();
  const [categoryResponse, productsResponse] = await Promise.all([
    supabase
      .from('categorias')
      .select(
        'id, mercado_id, nome, slug, descricao, imagem_url, ordem',
      )
      .eq('id', categoryId)
      .eq('mercado_id', market.id)
      .eq('ativo', true)
      .maybeSingle(),
    supabase
      .from('produtos')
      .select(
        'id, mercado_id, categoria_id, nome, descricao, marca, preco, preco_promocional, imagem_url, estoque, unidade, destaque',
      )
      .eq('mercado_id', market.id)
      .eq('categoria_id', categoryId)
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('nome', { ascending: true }),
  ]);

  if (categoryResponse.error) {
    throw new Error(
      `Não foi possível carregar a categoria: ${categoryResponse.error.message}`,
    );
  }

  if (productsResponse.error) {
    throw new Error(
      `Não foi possível carregar os produtos: ${productsResponse.error.message}`,
    );
  }

  return {
    category: categoryResponse.data as StorefrontCategory | null,
    products: productsResponse.data.map(normalizeProduct),
  };
}

function normalizeProduct(
  product: Omit<StorefrontProduct, 'preco' | 'preco_promocional' | 'estoque'> & {
    preco: number | string;
    preco_promocional: number | string | null;
    estoque: number | string;
  },
): StorefrontProduct {
  return {
    ...product,
    preco: Number(product.preco),
    preco_promocional:
      product.preco_promocional === null
        ? null
        : Number(product.preco_promocional),
    estoque: Number(product.estoque),
  };
}
