import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/app/lib/supabase/server';

const labels: Record<string, string> = {
  pendente: 'Pendente', confirmado: 'Aceito', em_separacao: 'Em separação', pronto: 'Pronto', saiu_para_entrega: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado',
};

export default async function PedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: loja } = await supabase.from('mercados').select('id').eq('proprietario_id', user.id).maybeSingle();
  if (!loja) redirect('/dashboard/configuracoes');
  const { status } = await searchParams;
  let query = supabase.from('pedidos').select('id,numero_pedido,cliente_nome,cliente_telefone,valor_total,status,tipo_entrega,forma_pagamento,created_at').eq('mercado_id', loja.id).order('created_at', { ascending: false });
  if (status === 'pendentes') query = query.eq('status', 'pendente');
  if (status === 'aceitos') query = query.in('status', ['confirmado','em_separacao','pronto']);
  if (status === 'enviados') query = query.eq('status', 'saiu_para_entrega');
  const { data: pedidos, error } = await query;
  if (error) throw error;
  return <div className="space-y-6"><header><h1 className="text-3xl font-bold">Pedidos</h1><p className="mt-1 text-sm text-zinc-500">Acompanhe e gerencie os pedidos da loja.</p></header><nav className="flex flex-wrap gap-2">{[['','Todos'],['pendentes','Pendentes'],['aceitos','Aceitos'],['enviados','Enviados']].map(([value,label])=><Link key={value} href={`/dashboard/pedidos${value?`?status=${value}`:''}`} className={`rounded-full px-4 py-2 text-sm font-semibold ${status===value||(!status&&!value)?'bg-zinc-950 text-white':'bg-white text-zinc-600 ring-1 ring-zinc-200'}`}>{label}</Link>)}</nav><section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white">{pedidos?.length ? pedidos.map((pedido)=><Link key={pedido.id} href={`/dashboard/pedidos/${pedido.id}`} className="flex items-center justify-between gap-4 border-b border-zinc-100 p-5 last:border-0 hover:bg-zinc-50"><div><p className="font-bold">Pedido #{pedido.numero_pedido}</p><p className="mt-1 text-sm text-zinc-500">{pedido.cliente_nome} · {pedido.tipo_entrega}</p></div><div className="text-right"><p className="font-bold">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(pedido.valor_total))}</p><span className="text-xs font-semibold text-zinc-500">{labels[pedido.status]||pedido.status}</span></div></Link>) : <p className="p-12 text-center text-sm text-zinc-500">Nenhum pedido encontrado.</p>}</section></div>;
}
