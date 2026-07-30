'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';

type Loja = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  logo_url: string | null;
  cor_primaria: string | null;
};

type IdentidadeVisualFormProps = {
  userId: string;
  loja: Loja;
};

export default function IdentidadeVisualForm({
  userId,
  loja,
}: IdentidadeVisualFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [logoUrl, setLogoUrl] = useState(loja.logo_url || '');
  const [logoPreview, setLogoPreview] = useState(loja.logo_url || '');
  const [corPrimaria, setCorPrimaria] = useState(
    getSafeColor(loja.cor_primaria),
  );
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  async function handleLogoUpload(file: File) {
    setErro(null);
    setSucesso(null);

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/svg+xml',
    ];

    if (!allowedTypes.includes(file.type)) {
      setErro('Envie uma imagem PNG, JPG, WEBP ou SVG.');
      return;
    }

    if (file.size > 1024 * 1024 * 5) {
      setErro('A logo precisa ter no máximo 5MB.');
      return;
    }

    setUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('mercado-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('mercado-assets')
        .getPublicUrl(filePath);

      setLogoUrl(data.publicUrl);
      setLogoPreview(data.publicUrl);
      setSucesso('Logo enviada. Salve as alterações para aplicá-la.');
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível enviar a logo.'));
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(null);

    try {
      if (!/^#[0-9a-f]{6}$/i.test(corPrimaria)) {
        throw new Error('Informe uma cor hexadecimal válida.');
      }

      const { error } = await supabase
        .from('mercados')
        .update({
          logo_url: logoUrl || null,
          cor_primaria: corPrimaria,
          updated_at: new Date().toISOString(),
        })
        .eq('id', loja.id);

      if (error) {
        throw error;
      }

      setSucesso('Identidade visual atualizada com sucesso.');
      router.refresh();
    } catch (error) {
      setErro(
        getErrorMessage(error, 'Não foi possível salvar a identidade visual.'),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-bold text-zinc-700">
              <DevicePhoneMobileIcon className="h-4 w-4" />
              App da loja
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 lg:text-4xl">
              Identidade visual
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
              Configure a logo e a cor principal usadas no app instalável e na
              vitrine pública da sua loja.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/dashboard/configuracoes"
              className="flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Configurações
            </Link>
            <a
              href={`/${loja.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-bold text-white transition hover:bg-zinc-800"
            >
              Ver loja
              <EyeIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
              <PaintBrushIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-950">
                Aparência do app
              </h2>
              <p className="text-sm font-medium text-zinc-400">
                Logo e cor principal usadas no app.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div
                className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: corPrimaria }}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt="Logo da loja"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ShoppingBagIcon className="h-12 w-12" />
                )}
              </div>
              <p className="mt-4 text-center text-xs font-bold text-zinc-400">
                Prévia do ícone
              </p>
            </div>

            <div className="space-y-5">
              <Field label="Logo/ícone da loja">
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-center transition hover:border-zinc-400 hover:bg-zinc-100">
                  <CloudArrowUpIcon className="h-7 w-7 text-zinc-400" />
                  <span className="mt-2 text-sm font-black text-zinc-700">
                    {uploadingLogo ? 'Enviando...' : 'Enviar logo'}
                  </span>
                  <span className="mt-1 text-xs font-medium text-zinc-400">
                    PNG, JPG, WEBP ou SVG até 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    disabled={uploadingLogo}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        handleLogoUpload(file);
                      }
                    }}
                  />
                </label>
              </Field>

              <Field label="Cor principal">
                <div className="flex h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-zinc-950 focus-within:ring-4 focus-within:ring-zinc-950/5">
                  <input
                    type="color"
                    value={corPrimaria}
                    onChange={(event) => setCorPrimaria(event.target.value)}
                    className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <input
                    value={corPrimaria}
                    onChange={(event) => setCorPrimaria(event.target.value)}
                    maxLength={7}
                    className="h-full flex-1 bg-transparent text-sm font-bold uppercase text-zinc-950 outline-none"
                  />
                </div>
              </Field>
            </div>
          </div>
        </section>

        <aside>
          <div className="sticky top-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-zinc-400">Prévia</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
              App da loja
            </h2>

            <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
              <div
                className="px-4 py-5 text-white"
                style={{ backgroundColor: corPrimaria }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/20">
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBagIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{loja.nome}</p>
                    <p className="truncate text-xs font-bold text-white/70">
                      /{loja.slug}
                    </p>
                  </div>
                </div>
                <p className="mt-5 text-2xl font-bold tracking-tight">
                  {loja.nome}
                </p>
                <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-white/75">
                  {loja.descricao ||
                    'Sua loja online pronta para vender e ser instalada no celular.'}
                </p>
              </div>
            </div>

            {erro && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {erro}
              </div>
            )}

            {sucesso && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                {sucesso}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploadingLogo}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-zinc-950 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar identidade visual'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-zinc-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function getSafeColor(color: string | null) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#111827';
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}
