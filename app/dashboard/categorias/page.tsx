import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import { CategoryManager } from './category-manager';

export type DashboardCategory = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  productCount: number;
};

export default async function CategoriasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: loja } = await supabase
    .from('mercados')
    .select('id, nome, slug')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (!loja) {
    redirect('/dashboard/configuracoes');
  }

  const [categoriesResponse, productsResponse] = await Promise.all([
    supabase
      .from('categorias')
      .select('id, nome, slug, descricao, imagem_url, ordem, ativo')
      .eq('mercado_id', loja.id)
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true }),
    supabase.from('produtos').select('categoria_id').eq('mercado_id', loja.id),
  ]);

  if (categoriesResponse.error) {
    throw categoriesResponse.error;
  }

  if (productsResponse.error) {
    throw productsResponse.error;
  }

  const productCounts = new Map<string, number>();

  for (const product of productsResponse.data || []) {
    if (product.categoria_id) {
      productCounts.set(
        product.categoria_id,
        (productCounts.get(product.categoria_id) || 0) + 1,
      );
    }
  }

  const categories: DashboardCategory[] = (categoriesResponse.data || []).map(
    (category) => ({
      ...category,
      ordem: category.ordem ?? 0,
      ativo: category.ativo !== false,
      productCount: productCounts.get(category.id) || 0,
    }),
  );

  return (
    <CategoryManager
      categories={categories}
      store={loja}
      userId={user.id}
    />
  );
}
