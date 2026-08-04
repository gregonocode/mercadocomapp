import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import MercadoOnboardingForm from './loja-onboarding-form';

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: mercado, error } = await supabase
    .from('mercados')
    .select(
      `
      id,
      nome,
      nome_fantasia,
      razao_social,
      cnpj,
      slug,
      descricao,
      telefone,
      whatsapp,
      email_contato,
      endereco,
      cidade,
      estado,
      cep,
      pix_chave,
      pix_nome,
      pedido_minimo,
      taxa_entrega,
      ativo
    `,
    )
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    <MercadoOnboardingForm
      userId={user.id}
      userEmail={user.email || ''}
      mercado={mercado}
    />
  );
}
