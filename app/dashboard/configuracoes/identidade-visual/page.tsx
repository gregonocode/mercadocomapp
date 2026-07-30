import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import IdentidadeVisualForm from './identidade-visual-form';

export default async function IdentidadeVisualPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: loja, error } = await supabase
    .from('mercados')
    .select('id, nome, slug, descricao, logo_url, cor_primaria')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!loja) {
    redirect('/dashboard/configuracoes');
  }

  return <IdentidadeVisualForm userId={user.id} loja={loja} />;
}
