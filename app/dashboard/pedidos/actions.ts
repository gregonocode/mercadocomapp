'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/app/lib/supabase/server';

export async function concluirPedidosEnviados() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const { data: loja, error: lojaError } = await supabase
    .from('mercados')
    .select('id')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (lojaError || !loja) {
    return { error: 'Não foi possível localizar sua loja.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'entregue',
      entregue_em: now,
      updated_at: now,
    })
    .eq('mercado_id', loja.id)
    .eq('status', 'saiu_para_entrega');

  if (error) {
    return { error: 'Não foi possível concluir os pedidos enviados.' };
  }

  revalidatePath('/dashboard/pedidos');
  return { error: null };
}

export async function enviarPedidosAceitos() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Sua sessão expirou. Entre novamente para continuar.' };
  }

  const { data: loja, error: lojaError } = await supabase
    .from('mercados')
    .select('id')
    .eq('proprietario_id', user.id)
    .maybeSingle();

  if (lojaError || !loja) {
    return { error: 'Não foi possível localizar sua loja.' };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'saiu_para_entrega',
      saiu_entrega_em: now,
      updated_at: now,
    })
    .eq('mercado_id', loja.id)
    .in('status', ['confirmado', 'em_separacao', 'pronto']);

  if (error) {
    return { error: 'Não foi possível enviar os pedidos aceitos.' };
  }

  revalidatePath('/dashboard/pedidos');
  return { error: null };
}
