import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import ProdutoForm from './produto-form';

export default async function NovoProdutoPage() {
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

  const { data: categorias, error: categoriasError } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('mercado_id', loja.id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })
    .order('nome', { ascending: true });

  if (categoriasError) {
    throw categoriasError;
  }

  return (
    <ProdutoForm
      loja={loja}
      userId={user.id}
      categorias={categorias || []}
    />
  );
}
