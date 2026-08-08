'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

type AccountForm = {
  nome: string; telefone: string; email: string; senha: string; cep: string; rua: string;
  numero: string; bairro: string; cidade: string; estado: string; complemento: string; referencia: string;
};

const emptyForm: AccountForm = { nome: '', telefone: '', email: '', senha: '', cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', complemento: '', referencia: '' };

export default function CustomerAccountClient({ slug, marketName }: { slug: string; marketName: string }) {
  const [form, setForm] = useState<AccountForm>(emptyForm);
  const [status, setStatus] = useState<'loading' | 'guest' | 'logged'>('loading');
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function fillFromUser(user: { email?: string; user_metadata: Record<string, unknown> }) {
    const saved = user.user_metadata.checkout_data as Partial<AccountForm> | undefined;
    setForm(current => ({ ...emptyForm, ...current, ...saved, email: user.email ?? current.email, senha: '' }));
    setStatus('logged');
  }

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fillFromUser(user);
      else setStatus('guest');
    });
  }, []);

  const set = (field: keyof AccountForm, value: string) => setForm(current => ({ ...current, [field]: value }));
  const checkoutData = () => ({ nome: form.nome.trim(), telefone: form.telefone.trim(), cep: form.cep.trim(), rua: form.rua.trim(), numero: form.numero.trim(), bairro: form.bairro.trim(), cidade: form.cidade.trim(), estado: form.estado.trim(), complemento: form.complemento.trim(), referencia: form.referencia.trim(), delivery: 'delivery', payment: 'pix' });

  function validate() {
    if (!form.nome.trim() || !form.telefone.trim()) return 'Informe seu nome e telefone.';
    if (!form.email.trim()) return 'Informe seu e-mail.';
    if (mode === 'register' && form.senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    const requiredAddress = [form.cep, form.rua, form.numero, form.bairro, form.cidade, form.estado];
    if (requiredAddress.some(value => !value.trim())) return 'Preencha os dados principais do endereço.';
    return '';
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = mode === 'login' && status === 'guest'
      ? !form.email.trim() ? 'Informe seu e-mail.' : !form.senha ? 'Informe sua senha.' : ''
      : validate();
    if (validation) return setMessage(validation);
    setLoading(true);
    setMessage('');
    const supabase = createClient();
    const data = checkoutData();

    if (status === 'logged') {
      const { error } = await supabase.auth.updateUser({ data: { checkout_data: data } });
      setLoading(false);
      setMessage(error ? error.message : 'Seus dados foram atualizados.');
      return;
    }

    if (mode === 'login') {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.senha });
      setLoading(false);
      if (error || !loginData.user) return setMessage(error?.message ?? 'Não foi possível entrar.');
      fillFromUser(loginData.user);
      setMessage('Você entrou na sua conta.');
      return;
    }

    const { data: signUpData, error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.senha, options: { data: { role: 'cliente', checkout_data: data } } });
    setLoading(false);
    if (error) return setMessage(error.message);
    if (signUpData.session && signUpData.user) fillFromUser(signUpData.user);
    setMessage(signUpData.session ? 'Conta criada e seus dados foram salvos.' : 'Conta criada! Confirme seu e-mail para entrar.');
  }

  async function signOut() {
    await createClient().auth.signOut();
    setForm(emptyForm);
    setStatus('guest');
    setMode('register');
    setMessage('Você saiu da sua conta.');
  }

  if (status === 'loading') return <main className="min-h-screen bg-zinc-50 p-6 text-zinc-950"><p className="mx-auto max-w-xl rounded-3xl bg-white p-6 text-center text-sm font-semibold text-zinc-500 shadow-sm">Carregando sua conta...</p></main>;

  const logged = status === 'logged';
  return <main className="min-h-screen bg-zinc-50 pb-10 text-zinc-950"><header className="border-b bg-white p-5"><div className="mx-auto max-w-xl"><Link href={`/${slug}`} className="text-sm font-semibold text-zinc-500">← Voltar para {marketName}</Link><h1 className="mt-2 text-2xl font-extrabold">{logged ? 'Minha conta' : mode === 'login' ? 'Entrar na conta' : 'Crie sua conta'}</h1><p className="mt-1 text-sm text-zinc-500">{logged ? 'Mantenha seus dados de entrega sempre atualizados.' : 'Salve seus dados para finalizar os próximos pedidos mais rápido.'}</p></div></header><form onSubmit={submit} className="mx-auto max-w-xl space-y-5 p-4"><section className="rounded-3xl bg-white p-5 shadow-sm"><div className="grid gap-3"><Field label="Nome" value={form.nome} onChange={value => set('nome', value)} required disabled={mode === 'login' && !logged} /><Field label="Telefone" value={form.telefone} onChange={value => set('telefone', value)} required disabled={mode === 'login' && !logged} inputMode="tel" /><Field label="E-mail" type="email" value={form.email} onChange={value => set('email', value)} required disabled={logged} />{!logged && <Field label="Senha" type="password" value={form.senha} onChange={value => set('senha', value)} required />}</div></section>{(logged || mode === 'register') && <section className="rounded-3xl bg-white p-5 shadow-sm"><h2 className="font-extrabold">Endereço de entrega</h2><p className="mt-1 text-sm text-zinc-500">Usaremos este endereço para agilizar seu próximo pedido.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="CEP" value={form.cep} onChange={value => set('cep', value)} required inputMode="numeric" /><Field label="Rua" value={form.rua} onChange={value => set('rua', value)} required /><Field label="Número" value={form.numero} onChange={value => set('numero', value)} required /><Field label="Bairro" value={form.bairro} onChange={value => set('bairro', value)} required /><Field label="Cidade" value={form.cidade} onChange={value => set('cidade', value)} required /><Field label="UF" value={form.estado} onChange={value => set('estado', value)} required /><Field label="Complemento" value={form.complemento} onChange={value => set('complemento', value)} /><Field label="Referência" value={form.referencia} onChange={value => set('referencia', value)} /></div></section>}<button type="submit" disabled={loading} className="w-full rounded-full bg-zinc-950 px-5 py-4 text-sm font-extrabold text-white disabled:opacity-50">{loading ? 'Salvando...' : logged ? 'Salvar alterações' : mode === 'login' ? 'Entrar' : 'Criar conta e salvar dados'}</button>{message && <p role="alert" className="rounded-xl bg-zinc-100 p-3 text-sm font-medium text-zinc-700">{message}</p>}{!logged && <button type="button" onClick={() => { setMode(current => current === 'register' ? 'login' : 'register'); setMessage(''); }} className="w-full text-sm font-bold text-zinc-600">{mode === 'register' ? 'Já tenho uma conta' : 'Ainda não tenho conta'}</button>}{logged && <button type="button" onClick={signOut} className="w-full text-sm font-bold text-red-600">Sair da conta</button>}</form></main>;
}

function Field({ label, value, onChange, type = 'text', required = false, disabled = false, inputMode }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  return <label className="block text-sm font-semibold">{label}{required && <span className="text-red-600"> *</span>}<input type={type} value={value} onChange={event => onChange(event.target.value)} required={required} disabled={disabled} inputMode={inputMode} autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : undefined} className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 font-normal outline-none focus:border-zinc-950 disabled:cursor-not-allowed disabled:bg-zinc-100" /></label>;
}
