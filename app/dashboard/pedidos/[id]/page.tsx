import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';
import PedidoDetailsClient from './pedido-details-client';

export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: loja } = await supabase.from('mercados').select('id,pix_chave,pix_nome').eq('proprietario_id', user.id).maybeSingle();
  if (!loja) redirect('/dashboard/configuracoes');
  const [{ data: pedido, error }, { data: itens, error: itensError }] = await Promise.all([
    supabase.from('pedidos').select('*').eq('id', id).eq('mercado_id', loja.id).maybeSingle(),
    supabase.from('pedido_itens').select('*').eq('pedido_id', id).order('created_at'),
  ]);
  if (error || itensError) throw error || itensError;
  if (!pedido) notFound();
  return <PedidoDetailsClient pedido={pedido} itens={itens || []} pixKey={loja.pix_chave} pixName={loja.pix_nome} />;
}
