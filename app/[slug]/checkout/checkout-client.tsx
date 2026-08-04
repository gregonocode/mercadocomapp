'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useStoreCart } from '@/app/components/storefront/cart-provider';

const steps = ['Seus dados', 'Entrega e endereço', 'Pagamento', 'Revisão e confirmação'];
type Delivery = 'delivery' | 'retirada';
type Payment = 'pix' | 'dinheiro' | 'cartao_entrega';
type FormData = Record<'nome' | 'telefone' | 'email' | 'cep' | 'rua' | 'numero' | 'bairro' | 'cidade' | 'estado' | 'complemento' | 'referencia' | 'observacao' | 'troco', string>;

export default function CheckoutClient({ slug, marketId, marketName, marketAddress }: { slug: string; marketId: string; marketName: string; marketAddress: { cep: string | null; cidade: string | null; estado: string | null } }) {
  const { items, subtotal, clearCart } = useStoreCart();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<Delivery>('delivery');
  const [payment, setPayment] = useState<Payment>('pix');
  const [form, setForm] = useState<FormData>({ nome: '', telefone: '', email: '', cep: marketAddress.cep ?? '', rua: '', numero: '', bairro: '', cidade: marketAddress.cidade ?? '', estado: marketAddress.estado ?? '', complemento: '', referencia: '', observacao: '', troco: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<{ numero_pedido: number; valor_total: number } | null>(null);
  const set = (key: keyof FormData, value: string) => setForm(current => ({ ...current, [key]: value }));

  function validate(currentStep: number) {
    if (!items.length) return 'Sua sacola está vazia.';
    if (currentStep === 0) {
      if (!form.nome.trim() || !form.telefone.trim()) return 'Informe seu nome e telefone para continuar.';
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return 'Informe um e-mail válido ou deixe o campo em branco.';
    }
    if (currentStep === 1 && delivery === 'delivery') {
      const requiredAddress = ['cep', 'rua', 'numero', 'bairro', 'cidade', 'estado'] as const;
      if (requiredAddress.some(field => !form[field].trim())) return 'Preencha os dados obrigatórios do endereço para continuar.';
    }
    return '';
  }

  function next() {
    const validationError = validate(step);
    if (validationError) return setError(validationError);
    setError('');
    setStep(current => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < steps.length - 1) return next();
    const validationError = validate(0) || validate(1);
    if (validationError) return setError(validationError);
    setError('');
    setLoading(true);
    const { data, error: rpcError } = await createClient().rpc('criar_pedido', {
      p_mercado_id: marketId,
      p_cliente_nome: form.nome,
      p_cliente_telefone: form.telefone,
      p_cliente_email: form.email || null,
      p_tipo_entrega: delivery,
      p_forma_pagamento: payment,
      p_itens: items.map(item => ({ produto_id: item.id, quantidade: item.quantidade })),
      p_endereco: delivery === 'delivery' ? { cep: form.cep, rua: form.rua, numero: form.numero, bairro: form.bairro, cidade: form.cidade, estado: form.estado, complemento: form.complemento, referencia: form.referencia } : {},
      p_observacao: form.observacao || null,
      p_troco_para: payment === 'dinheiro' && form.troco ? Number(form.troco.replace(',', '.')) : null,
    });
    setLoading(false);
    if (rpcError) return setError(rpcError.message);
    clearCart();
    setOrder(Array.isArray(data) ? data[0] : data);
  }

  if (order) return <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950"><section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-emerald-600">Pedido recebido</p><h1 className="mt-2 text-3xl font-extrabold">Pedido #{order.numero_pedido}</h1><p className="mt-3 text-zinc-500">Total: {currency(order.valor_total)}. O mercado receberá seu pedido em instantes.</p><Link href={`/${slug}`} className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white">Voltar à loja</Link></section></main>;

  return <main className="min-h-screen bg-zinc-50 pb-10 text-zinc-950"><header className="border-b bg-white p-5"><div className="mx-auto max-w-xl"><Link href={`/${slug}/sacola`} className="text-sm font-semibold text-zinc-500">← Sacola</Link><h1 className="mt-2 text-2xl font-extrabold">Finalizar pedido</h1><p className="text-sm text-zinc-500">{marketName}</p></div></header><form onSubmit={submit} className="mx-auto max-w-xl space-y-5 p-4"><Progress step={step} />
    {step === 0 && <Card title="Seus dados" description="Precisamos destes dados para identificar seu pedido."><div className="grid gap-3"><Input label="Nome" value={form.nome} onChange={v => set('nome', v)} required /><Input label="Telefone" value={form.telefone} onChange={v => set('telefone', v)} required inputMode="tel" /><Input label="E-mail (opcional)" type="email" value={form.email} onChange={v => set('email', v)} /></div></Card>}
    {step === 1 && <Card title="Entrega e endereço" description="CEP, cidade e UF são definidos conforme o mercado."><div className="flex gap-2"><Choice active={delivery === 'delivery'} onClick={() => setDelivery('delivery')} label="Entrega" /><Choice active={delivery === 'retirada'} onClick={() => setDelivery('retirada')} label="Retirada" /></div>{delivery === 'delivery' ? <div className="mt-4 grid gap-3 sm:grid-cols-2"><Input label="CEP" value={form.cep} onChange={v => set('cep', v)} required inputMode="numeric" readOnly /><Input label="Rua" value={form.rua} onChange={v => set('rua', v)} required /><Input label="Número" value={form.numero} onChange={v => set('numero', v)} required /><Input label="Bairro" value={form.bairro} onChange={v => set('bairro', v)} required /><Input label="Cidade" value={form.cidade} onChange={v => set('cidade', v)} required readOnly /><Input label="UF" value={form.estado} onChange={v => set('estado', v)} required readOnly /><Input label="Complemento (opcional)" value={form.complemento} onChange={v => set('complemento', v)} /><Input label="Referência (opcional)" value={form.referencia} onChange={v => set('referencia', v)} /></div> : <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">Você poderá retirar o pedido diretamente no mercado.</p>}</Card>}
    {step === 2 && <Card title="Pagamento" description="Escolha como prefere pagar."><div className="flex flex-wrap gap-2">{([['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao_entrega', 'Cartão na entrega']] as const).map(([value, label]) => <Choice key={value} active={payment === value} onClick={() => setPayment(value)} label={label} />)}</div>{payment === 'dinheiro' && <div className="mt-4"><Input label="Troco para (opcional)" value={form.troco} onChange={v => set('troco', v)} inputMode="decimal" /></div>}</Card>}
    {step === 3 && <Card title="Revisão e confirmação" description="Confira os dados antes de enviar o pedido."><div className="space-y-4 text-sm"><Review label="Contato" value={`${form.nome} · ${form.telefone}`} /><Review label="Recebimento" value={delivery === 'delivery' ? `${form.rua}, ${form.numero} — ${form.bairro}, ${form.cidade}/${form.estado}` : 'Retirada no mercado'} /><Review label="Pagamento" value={paymentLabel(payment)} />{payment === 'dinheiro' && form.troco && <Review label="Troco para" value={currency(Number(form.troco.replace(',', '.')))} />}<label className="block font-semibold">Observação (opcional)<textarea value={form.observacao} onChange={event => set('observacao', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-950" /></label><div className="border-t pt-4"><p className="text-zinc-500">{items.length} produto(s)</p><p className="mt-1 text-xl font-extrabold">Subtotal: {currency(subtotal)}</p><p className="mt-2 text-xs text-zinc-500">Frete e total são confirmados pelo mercado ao enviar o pedido.</p></div></div></Card>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex gap-3">{step > 0 && <button type="button" onClick={() => { setError(''); setStep(current => current - 1); }} className="rounded-full border border-zinc-200 px-5 py-4 text-sm font-extrabold">Voltar</button>}<button type="submit" disabled={loading} className="flex-1 rounded-full bg-zinc-950 px-5 py-4 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Enviando pedido...' : step === steps.length - 1 ? 'Confirmar pedido' : 'Próximo'}</button></div></form></main>;
}

function Progress({ step }: { step: number }) { return <ol className="grid grid-cols-4 gap-1" aria-label="Etapas do checkout">{steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-1 rounded-full ${index <= step ? 'bg-zinc-950' : 'bg-zinc-200'}`} /><p className={`mt-2 text-xs font-semibold leading-tight ${index === step ? 'text-zinc-950' : 'text-zinc-400'}`}>{index + 1}. {label}</p></li>)}</ol>; }
function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-extrabold">{title}</h2>{description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}<div className="mt-4">{children}</div></section>; }
function Input({ label, value, onChange, type = 'text', required = false, inputMode, readOnly = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; readOnly?: boolean }) { return <label className="block text-sm font-semibold">{label}{required && <span className="text-red-600"> *</span>}<input type={type} value={value} onChange={e => onChange(e.target.value)} inputMode={inputMode} readOnly={readOnly} className={`mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 font-normal outline-none focus:border-zinc-950 ${readOnly ? 'cursor-not-allowed bg-zinc-100 text-zinc-500' : ''}`} /></label>; }
function Choice({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) { return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{label}</button>; }
function Review({ label, value }: { label: string; value: string }) { return <div><p className="font-semibold text-zinc-500">{label}</p><p className="mt-1">{value}</p></div>; }
function paymentLabel(payment: Payment) { return payment === 'pix' ? 'Pix' : payment === 'dinheiro' ? 'Dinheiro' : 'Cartão na entrega'; }
function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)); }
