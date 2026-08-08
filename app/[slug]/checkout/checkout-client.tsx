'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useStoreCart } from '@/app/components/storefront/cart-provider';

const steps = ['Seus dados', 'Entrega e endereço', 'Pagamento', 'Revisão e confirmação'];
type Delivery = 'delivery' | 'retirada';
type Payment = 'pix' | 'dinheiro' | 'cartao_entrega';
type FormData = Record<'nome' | 'telefone' | 'email' | 'cep' | 'rua' | 'numero' | 'bairro' | 'cidade' | 'estado' | 'complemento' | 'referencia' | 'observacao' | 'troco', string>;
type LocationData = { latitude: number | null; longitude: number | null; capturedAt: string | null };
type SavedCustomerData = Partial<Pick<FormData, 'nome' | 'telefone' | 'cep' | 'rua' | 'numero' | 'bairro' | 'cidade' | 'estado' | 'complemento' | 'referencia'>> & { delivery?: Delivery; payment?: Payment };

export default function CheckoutClient({ slug, marketId, marketName, pedidoMinimo, taxaEntrega, marketAddress }: { slug: string; marketId: string; marketName: string; pedidoMinimo: number | null; taxaEntrega: number | null; marketAddress: { cep: string | null; cidade: string | null; estado: string | null } }) {
  const { items, subtotal, clearCart } = useStoreCart();
  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState<Delivery>('delivery');
  const [payment, setPayment] = useState<Payment>('pix');
  const [form, setForm] = useState<FormData>({ nome: '', telefone: '', email: '', cep: marketAddress.cep ?? '', rua: '', numero: '', bairro: '', cidade: marketAddress.cidade ?? '', estado: marketAddress.estado ?? '', complemento: '', referencia: '', observacao: '', troco: '' });
  const [location, setLocation] = useState<LocationData>({ latitude: null, longitude: null, capturedAt: null });
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [locationPromptOpen, setLocationPromptOpen] = useState(false);
  const [locationPromptSkipped, setLocationPromptSkipped] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<{ numero_pedido: number; valor_total: number } | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');
  const [hasAccount, setHasAccount] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);
  const set = (key: keyof FormData, value: string) => setForm(current => ({ ...current, [key]: value }));
  const freteGratis = pedidoMinimo !== null && subtotal >= pedidoMinimo;
  const taxaAplicada = delivery === 'delivery' && !freteGratis ? (taxaEntrega ?? 0) : 0;
  const totalComEntrega = subtotal + taxaAplicada;

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setHasAccount(true);
      const savedData = user.user_metadata?.checkout_data as SavedCustomerData | undefined;
      if (!savedData) return;
      const { delivery: savedDelivery, payment: savedPayment, ...savedFormData } = savedData;
      const savedForm = Object.fromEntries(Object.entries(savedFormData).filter(([, value]) => typeof value === 'string' && value.trim()));
      const hasSavedCheckout = Boolean(savedData.nome && savedData.telefone && (savedDelivery === 'retirada' || (savedData.cep && savedData.rua && savedData.numero && savedData.bairro && savedData.cidade && savedData.estado)));
      setForm(current => ({ ...current, email: user.email ?? current.email, ...savedForm }));
      if (savedDelivery === 'delivery' || savedDelivery === 'retirada') setDelivery(savedDelivery);
      if (savedPayment === 'pix' || savedPayment === 'dinheiro' || savedPayment === 'cartao_entrega') setPayment(savedPayment);
      if (hasSavedCheckout) {
        setStep(steps.length - 1);
      }
    }).finally(() => setAccountChecked(true));
  }, []);

  function captureCurrentLocation(advanceOnSuccess: boolean | React.MouseEvent<HTMLButtonElement> = false) {
    if (!navigator.geolocation) {
      setError('Seu navegador não permite capturar a localização.');
      return;
    }

    setCapturingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ latitude: Number(coords.latitude.toFixed(8)), longitude: Number(coords.longitude.toFixed(8)), capturedAt: new Date().toISOString() });
        setCapturingLocation(false);
        if (advanceOnSuccess === true) {
          setLocationPromptOpen(false);
          advanceToNextStep();
        }
      },
      () => {
        setError('Não foi possível capturar sua localização. Verifique a permissão do navegador e tente novamente.');
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

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

  function advanceToNextStep() {
    setError('');
    setStep(current => Math.min(current + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function next() {
    const validationError = validate(step);
    if (validationError) return setError(validationError);
    if (step === 1 && delivery === 'delivery' && location.latitude === null && !locationPromptSkipped) {
      setLocationPromptOpen(true);
      return;
    }
    advanceToNextStep();
  }

  function continueWithoutLocation() {
    setLocationPromptSkipped(true);
    setLocationPromptOpen(false);
    advanceToNextStep();
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
      p_endereco: delivery === 'delivery' ? { cep: form.cep, rua: form.rua, numero: form.numero, bairro: form.bairro, cidade: form.cidade, estado: form.estado, complemento: form.complemento, referencia: form.referencia, latitude: location.latitude, longitude: location.longitude, localizacao_capturada_em: location.capturedAt } : {},
      p_observacao: form.observacao || null,
      p_troco_para: payment === 'dinheiro' && form.troco ? Number(form.troco.replace(',', '.')) : null,
    });
    setLoading(false);
    if (rpcError) return setError(rpcError.message);
    clearCart();
    setOrder(Array.isArray(data) ? data[0] : data);
  }

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    if (!form.email.trim()) {
      setAccountMessage('Informe seu e-mail para criar a conta.');
      return;
    }
    if (accountPassword.length < 6) {
      setAccountMessage('Sua senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    setAccountLoading(true);
    setAccountMessage('');
    const checkoutData: SavedCustomerData = {
      nome: form.nome, telefone: form.telefone, cep: form.cep, rua: form.rua, numero: form.numero,
      bairro: form.bairro, cidade: form.cidade, estado: form.estado, complemento: form.complemento, referencia: form.referencia,
      delivery, payment,
    };
    const { data, error: signUpError } = await createClient().auth.signUp({
      email: form.email.trim(),
      password: accountPassword,
      options: { data: { role: 'cliente', checkout_data: checkoutData } },
    });
    setAccountLoading(false);
    if (signUpError) {
      setAccountMessage(signUpError.message);
      return;
    }
    setHasAccount(true);
    setAccountPassword('');
    setAccountMessage(data.session ? 'Conta criada e você já está conectado.' : 'Conta criada! Confirme seu e-mail para entrar nos próximos pedidos.');
  }

  if (!accountChecked) return <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950"><div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-zinc-600">Preparando seu checkout...</p></div></main>;

  if (order) return <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950"><section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><p className="text-sm font-semibold text-emerald-600">Pedido recebido</p><h1 className="mt-2 text-3xl font-extrabold">Pedido #{order.numero_pedido}</h1><p className="mt-3 text-zinc-500">Total: {currency(order.valor_total)}. O mercado receberá seu pedido em instantes.</p>{hasAccount ? <div className="mt-6 rounded-2xl bg-emerald-50 p-4 text-left"><p className="font-bold text-emerald-800">Seus dados estão salvos</p><p className="mt-1 text-sm text-emerald-700">No próximo pedido, você poderá finalizar muito mais rápido.</p>{accountMessage && <p className="mt-2 text-sm font-medium text-emerald-800">{accountMessage}</p>}</div> : <form onSubmit={createAccount} className="mt-6 rounded-2xl border border-zinc-200 p-5 text-left"><h2 className="text-lg font-extrabold">Salve seus dados para a próxima compra</h2><p className="mt-1 text-sm leading-6 text-zinc-600">Seu pedido já foi feito. Crie sua conta agora e, no próximo pedido, seu endereço e dados já estarão salvos para você pedir em apenas 2 cliques.</p><div className="mt-4 grid gap-3"><Input label="E-mail" type="email" value={form.email} onChange={v => set('email', v)} required /><Input label="Crie uma senha" type="password" value={accountPassword} onChange={setAccountPassword} required /><button type="submit" disabled={accountLoading} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{accountLoading ? 'Criando conta...' : 'Criar conta e salvar meus dados'}</button></div>{accountMessage && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{accountMessage}</p>}</form>}<Link href={`/${slug}`} className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white">Voltar à loja</Link></section></main>;

  return <main className="min-h-screen bg-zinc-50 pb-10 text-zinc-950"><header className="border-b bg-white p-5"><div className="mx-auto max-w-xl"><Link href={`/${slug}/sacola`} className="text-sm font-semibold text-zinc-500">← Sacola</Link><h1 className="mt-2 text-2xl font-extrabold">Finalizar pedido</h1><p className="text-sm text-zinc-500">{marketName}</p></div></header><form onSubmit={submit} className="mx-auto max-w-xl space-y-5 p-4"><Progress step={step} />
    {step === 0 && <Card title="Seus dados" description="Precisamos destes dados para identificar seu pedido."><div className="grid gap-3"><Input label="Nome" value={form.nome} onChange={v => set('nome', v)} required /><Input label="Telefone" value={form.telefone} onChange={v => set('telefone', v)} required inputMode="tel" /></div></Card>}
    {step === 1 && <Card title="Entrega e endereco" description="Informe o endereco onde o pedido deve ser entregue."><div className="flex gap-2"><Choice active={delivery === 'delivery'} onClick={() => setDelivery('delivery')} label="Entrega" /><Choice active={delivery === 'retirada'} onClick={() => setDelivery('retirada')} label="Retirada" /></div>{delivery === 'delivery' ? <><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input label="CEP" value={form.cep} onChange={v => set('cep', v)} required inputMode="numeric" readOnly /><Input label="Rua" value={form.rua} onChange={v => set('rua', v)} required /><Input label="Numero" value={form.numero} onChange={v => set('numero', v)} required /><Input label="Bairro" value={form.bairro} onChange={v => set('bairro', v)} required /><Input label="Cidade" value={form.cidade} onChange={v => set('cidade', v)} required readOnly /><Input label="UF" value={form.estado} onChange={v => set('estado', v)} required readOnly /><Input label="Complemento (opcional)" value={form.complemento} onChange={v => set('complemento', v)} /><Input label="Referencia (opcional)" value={form.referencia} onChange={v => set('referencia', v)} /></div><div className={`mt-4 rounded-xl border p-3 ${location.latitude !== null && location.longitude !== null ? 'border-emerald-100 bg-emerald-50/60' : 'border-zinc-200 bg-zinc-50'}`}><button type="button" onClick={captureCurrentLocation} disabled={capturingLocation} className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{capturingLocation ? 'Capturando localizacao...' : location.latitude !== null ? 'Atualizar minha localizacao' : 'Enviar minha localizacao atual'}</button>{location.latitude !== null && location.longitude !== null ? <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true"><path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.25 7.31a1 1 0 0 1-1.42.005L3.29 9.338a1 1 0 1 1 1.42-1.405l4.04 4.084 6.54-6.592a1 1 0 0 1 1.414-.135Z" clipRule="evenodd" /></svg>Localizacao salva com sucesso!</p> : <p className="mt-2 text-xs text-zinc-500">Opcional: use sua localizacao para facilitar a entrega.</p>}</div></> : <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-600">Voce podera retirar o pedido diretamente no mercado.</p>}</Card>}
    {step === 2 && <Card title="Pagamento" description="Escolha como prefere pagar."><div className="flex flex-wrap gap-2">{([['pix', 'Pix'], ['dinheiro', 'Dinheiro'], ['cartao_entrega', 'Cartao na entrega']] as const).map(([value, label]) => <Choice key={value} active={payment === value} onClick={() => setPayment(value)} label={label} />)}</div>{payment === 'dinheiro' && <div className="mt-4"><Input label="Troco para (opcional)" value={form.troco} onChange={v => set('troco', v)} inputMode="decimal" /></div>}</Card>}
    {step === 3 && <Card title="Revisao e confirmacao" description="Confira os dados antes de enviar o pedido."><div className="space-y-4 text-sm"><Review label="Contato" value={`${form.nome} - ${form.telefone}`} /><Review label="Recebimento" value={delivery === 'delivery' ? `${form.rua}, ${form.numero} - ${form.bairro}, ${form.cidade}/${form.estado}` : 'Retirada no mercado'} /><Review label="Pagamento" value={paymentLabel(payment)} />{payment === 'dinheiro' && form.troco && <Review label="Troco para" value={currency(Number(form.troco.replace(',', '.')))} />}<label className="block font-semibold">Observacao (opcional)<textarea value={form.observacao} onChange={event => set('observacao', event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-zinc-200 p-3 font-normal outline-none focus:border-zinc-950" /></label><div className="border-t pt-4"><p className="text-zinc-500">{items.length} produto(s)</p><div className="mt-2 space-y-1 text-sm"><p className="flex justify-between text-zinc-500"><span>Produtos</span><span>{currency(subtotal)}</span></p><p className="flex justify-between text-zinc-500"><span>Entrega</span><span>{delivery === 'retirada' ? 'Retirada no mercado' : taxaAplicada > 0 ? currency(taxaAplicada) : 'Grátis'}</span></p></div><p className="mt-3 text-xl font-extrabold">Total: {currency(totalComEntrega)}</p></div></div></Card>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="flex gap-3">{step > 0 && <button type="button" onClick={() => { setError(''); setStep(current => current - 1); }} className="rounded-full border border-zinc-200 px-5 py-4 text-sm font-extrabold">Voltar</button>}<button type="submit" disabled={loading} className="flex-1 rounded-full bg-zinc-950 px-5 py-4 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Enviando pedido...' : step === steps.length - 1 ? 'Confirmar pedido' : 'Proximo'}</button></div></form>{locationPromptOpen && <div role="dialog" aria-modal="true" aria-labelledby="location-prompt-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-md"><section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"><h2 id="location-prompt-title" className="text-xl font-extrabold">Facilite a sua entrega</h2><p className="mt-3 text-sm leading-6 text-zinc-600">Ao enviar sua localizacao atual, o mercado encontra seu endereco com mais facilidade e sua entrega pode chegar ainda mais rapido.</p><button type="button" onClick={() => captureCurrentLocation(true)} disabled={capturingLocation} className="mt-5 w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{capturingLocation ? 'Capturando localizacao...' : 'Enviar minha localizacao atual'}</button><button type="button" onClick={continueWithoutLocation} disabled={capturingLocation} className="mt-3 w-full rounded-full px-5 py-3 text-sm font-bold text-zinc-600 disabled:opacity-50">Nao enviar localizacao agora</button></section></div>}</main>;
}

function Progress({ step }: { step: number }) { return <ol className="grid grid-cols-4 gap-1" aria-label="Etapas do checkout">{steps.map((label, index) => <li key={label} className="min-w-0"><div className={`h-1 rounded-full ${index <= step ? 'bg-zinc-950' : 'bg-zinc-200'}`} /><p className={`mt-2 text-xs font-semibold leading-tight ${index === step ? 'text-zinc-950' : 'text-zinc-400'}`}>{index + 1}. {label}</p></li>)}</ol>; }
function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) { return <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-extrabold">{title}</h2>{description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}<div className="mt-4">{children}</div></section>; }
function Input({ label, value, onChange, type = 'text', required = false, inputMode, readOnly = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; readOnly?: boolean }) { return <label className="block text-sm font-semibold">{label}{required && <span className="text-red-600"> *</span>}<input type={type} value={value} onChange={e => onChange(e.target.value)} inputMode={inputMode} readOnly={readOnly} autoComplete={type === 'password' ? 'new-password' : type === 'email' ? 'email' : undefined} className={`mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 font-normal outline-none focus:border-zinc-950 ${readOnly ? 'cursor-not-allowed bg-zinc-100 text-zinc-500' : ''}`} /></label>; }
function Choice({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) { return <button type="button" onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-bold ${active ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-600'}`}>{label}</button>; }
function Review({ label, value }: { label: string; value: string }) { return <div><p className="font-semibold text-zinc-500">{label}</p><p className="mt-1">{value}</p></div>; }
function paymentLabel(payment: Payment) { return payment === 'pix' ? 'Pix' : payment === 'dinheiro' ? 'Dinheiro' : 'Cartao na entrega'; }
function currency(value: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0)); }
