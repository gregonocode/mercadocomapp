'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';
import { loginWithPassword } from './actions';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErro(null);

    try {
      const result = await loginWithPassword({
        email,
        password: senha,
      });

      if (!result.ok) {
        setErro(result.error);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível entrar agora. Tente novamente.';

      setErro(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setErro(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden p-4 lg:block">
          <div className="relative flex h-full min-h-[calc(100vh-2rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(192,132,252,0.95),rgba(126,34,206,0.6)_28%,rgba(24,24,27,0.95)_62%,rgba(0,0,0,1)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),rgba(0,0,0,0.45))]" />
            <div className="absolute inset-0 opacity-[0.13] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:18px_18px]" />

            <div className="relative z-10 flex w-full flex-col items-center justify-center px-10 text-center">
              <div className="mb-7 flex items-center justify-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white">
                  <span className="h-2 w-2 rounded-full bg-white" />
                </span>
                <span className="text-sm font-semibold tracking-tight">
                  lojacomapp
                </span>
              </div>

              <h1 className="max-w-md text-4xl font-semibold tracking-[-0.04em] text-white">
                Comece sua loja com app
              </h1>

              <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-300">
                Acesse sua conta para gerenciar produtos, pedidos e sua loja
                online instalável.
              </p>

              <div className="mt-10 w-full max-w-xs space-y-3">
                <Step active number="1" text="Entre na sua conta" />
                <Step number="2" text="Gerencie sua loja" />
                <Step number="3" text="Venda com seu App" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-10 text-center lg:hidden">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
                <ShoppingBagIcon className="h-6 w-6" />
              </div>
              <p className="text-xl font-semibold tracking-tight">
                lojacomapp
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Sua loja online com aplicativo
              </p>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                Entrar na conta
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Acesse sua dashboard para gerenciar sua loja.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex h-12 items-center justify-center gap-3 rounded-xl border border-white/10 bg-black text-sm font-medium text-white transition hover:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <GoogleIcon />
                Google
              </button>
            </div>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-600">Ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="ex. voce@email.com"
                  className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20 focus:ring-4 focus:ring-white/5"
                />
              </div>

              <div>
                <label
                  htmlFor="senha"
                  className="text-sm font-medium text-zinc-300"
                >
                  Senha
                </label>

                <div className="relative mt-2">
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    required
                    minLength={6}
                    placeholder="Digite sua senha"
                    className="h-12 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-white/20 focus:ring-4 focus:ring-white/5"
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-zinc-300"
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-zinc-600">
                  Use a senha cadastrada na sua conta.
                </p>
              </div>

              {erro && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {traduzirErroSupabase(erro)}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Entrando...' : 'Entrar'}

                {!loading && (
                  <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-zinc-600">
              Ainda não tem conta?{' '}
              <span className="font-medium text-zinc-300">
                Fale com o suporte
              </span>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({
  number,
  text,
  active = false,
}: {
  number: string;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        'flex h-14 items-center gap-4 rounded-xl px-5 text-left text-sm font-medium transition',
        active
          ? 'bg-white text-black shadow-2xl shadow-black/20'
          : 'bg-white/10 text-zinc-400 backdrop-blur-md',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
          active ? 'bg-black text-white' : 'bg-white/10 text-zinc-500',
        ].join(' ')}
      >
        {active ? <CheckIcon className="h-3.5 w-3.5" /> : number}
      </span>

      <span>{text}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.2C29.1 35.2 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function traduzirErroSupabase(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (lowerMessage.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (lowerMessage.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  if (
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('network')
  ) {
    return 'Nao foi possivel conectar ao servidor de login. Verifique a conexao e tente novamente.';
  }

  return message;
}
