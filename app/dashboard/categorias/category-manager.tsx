'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';
import type { DashboardCategory } from './page';

const CATEGORY_IMAGES_BUCKET = 'categoria-imagens';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type Store = {
  id: string;
  nome: string;
  slug: string;
};

type CategoryManagerProps = {
  categories: DashboardCategory[];
  store: Store;
  userId: string;
};

type FormState = {
  id: string | null;
  nome: string;
  descricao: string;
  imagemUrl: string;
  ordem: string;
  ativo: boolean;
};

const EMPTY_FORM: FormState = {
  id: null,
  nome: '',
  descricao: '',
  imagemUrl: '',
  ordem: '0',
  ativo: true,
};

export function CategoryManager({
  categories,
  store,
  userId,
}: CategoryManagerProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const activeCount = categories.filter((category) => category.ativo).length;
  const productsCount = categories.reduce(
    (total, category) => total + category.productCount,
    0,
  );

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [success]);

  function openCreateDialog() {
    const nextOrder = categories.length
      ? Math.max(...categories.map((category) => category.ordem)) + 1
      : 0;

    setForm({ ...EMPTY_FORM, ordem: String(nextOrder) });
    setError(null);
    dialogRef.current?.showModal();
  }

  function openEditDialog(category: DashboardCategory) {
    setForm({
      id: category.id,
      nome: category.nome,
      descricao: category.descricao || '',
      imagemUrl: category.imagem_url || '',
      ordem: String(category.ordem),
      ativo: category.ativo,
    });
    setError(null);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (saving || uploading) return;
    dialogRef.current?.close();
    setError(null);
  }

  async function handleImageUpload(file: File) {
    setError(null);
    const extension = IMAGE_EXTENSIONS[file.type];

    if (!extension) {
      setError('Envie uma imagem PNG, JPG ou WEBP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError('A imagem precisa ter no máximo 5 MB.');
      return;
    }

    setUploading(true);

    try {
      const filePath = `${userId}/categorias/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(CATEGORY_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(CATEGORY_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      setForm((current) => ({ ...current, imagemUrl: data.publicUrl }));
    } catch (uploadError) {
      setError(
        getErrorMessage(
          uploadError,
          'Não foi possível enviar a imagem da categoria.',
        ),
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const nome = form.nome.trim();
      const ordem = Number(form.ordem);

      if (!nome) throw new Error('Informe o nome da categoria.');
      if (!Number.isInteger(ordem) || ordem < 0) {
        throw new Error('A ordem precisa ser um número inteiro positivo.');
      }

      const values = {
        mercado_id: store.id,
        nome,
        slug: slugify(nome),
        descricao: form.descricao.trim() || null,
        imagem_url: form.imagemUrl || null,
        ordem,
        ativo: form.ativo,
        updated_at: new Date().toISOString(),
      };

      const response = form.id
        ? await supabase
            .from('categorias')
            .update(values)
            .eq('id', form.id)
            .eq('mercado_id', store.id)
        : await supabase.from('categorias').insert(values);

      if (response.error) throw response.error;

      dialogRef.current?.close();
      setSuccess(
        form.id
          ? 'Categoria atualizada com sucesso.'
          : 'Categoria criada com sucesso.',
      );
      router.refresh();
    } catch (submitError) {
      setError(
        getErrorMessage(
          submitError,
          'Não foi possível salvar a categoria.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleCategory(category: DashboardCategory) {
    setError(null);

    const { error: updateError } = await supabase
      .from('categorias')
      .update({
        ativo: !category.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', category.id)
      .eq('mercado_id', store.id);

    if (updateError) {
      setError(getErrorMessage(updateError, 'Não foi possível mudar o status.'));
      return;
    }

    setSuccess(
      category.ativo ? 'Categoria desativada.' : 'Categoria ativada.',
    );
    router.refresh();
  }

  async function deleteCategory(category: DashboardCategory) {
    if (category.productCount > 0) {
      setError(
        'Mova ou exclua os produtos desta categoria antes de removê-la.',
      );
      return;
    }

    if (!window.confirm(`Excluir a categoria “${category.nome}”?`)) return;

    setDeletingId(category.id);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('categorias')
        .delete()
        .eq('id', category.id)
        .eq('mercado_id', store.id);

      if (deleteError) throw deleteError;

      const imagePath = getBucketFilePath(category.imagem_url);
      if (imagePath) {
        await supabase.storage.from(CATEGORY_IMAGES_BUCKET).remove([imagePath]);
      }

      setSuccess('Categoria excluída com sucesso.');
      router.refresh();
    } catch (deleteError) {
      setError(
        getErrorMessage(deleteError, 'Não foi possível excluir a categoria.'),
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Organize as seções exibidas na vitrine da {store.nome}.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateDialog}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-black"
        >
          Nova categoria
          <PlusIcon className="h-4 w-4" />
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Categorias" value={categories.length} icon={TagIcon} />
        <Metric label="Ativas na vitrine" value={activeCount} icon={CheckCircleIcon} />
        <Metric label="Produtos vinculados" value={productsCount} icon={CubeIcon} />
      </section>

      {error && (
        <Notice tone="error" onClose={() => setError(null)}>
          {error}
        </Notice>
      )}
      {success && (
        <Notice tone="success" onClose={() => setSuccess(null)}>
          {success}
        </Notice>
      )}

      {categories.length ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-zinc-300"
            >
              <div className="relative aspect-[16/8] bg-[#F4F2FF]">
                {category.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.imagem_url}
                    alt={category.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    <PhotoIcon className="h-10 w-10" />
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                    category.ativo
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-white text-zinc-500'
                  }`}
                >
                  {category.ativo ? 'Ativa' : 'Inativa'}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-zinc-600 shadow-sm backdrop-blur">
                  Ordem {category.ordem}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-zinc-950">
                      {category.nome}
                    </h2>
                    <p className="mt-1 text-xs font-semibold text-zinc-400">
                      {category.productCount}{' '}
                      {category.productCount === 1 ? 'produto' : 'produtos'}
                    </p>
                  </div>
                  <Link
                    href={`/${store.slug}/${category.id}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Ver ${category.nome} na vitrine`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </Link>
                </div>

                <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-500">
                  {category.descricao || 'Sem descrição cadastrada.'}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4">
                  <button
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className="h-9 flex-1 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                  >
                    {category.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditDialog(category)}
                    aria-label={`Editar ${category.nome}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-950"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCategory(category)}
                    disabled={deletingId === category.id}
                    aria-label={`Excluir ${category.nome}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F4F2FF] text-zinc-700">
            <TagIcon className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-zinc-950">
            Nenhuma categoria cadastrada
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Crie a primeira categoria para começar a organizar os produtos da
            sua loja.
          </p>
          <button
            type="button"
            onClick={openCreateDialog}
            className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"
          >
            Criar categoria
            <PlusIcon className="h-4 w-4" />
          </button>
        </section>
      )}

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          if (saving || uploading) event.preventDefault();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-xl rounded-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/50"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-start justify-between border-b border-zinc-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {form.id ? 'Editar categoria' : 'Nova categoria'}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                As informações serão exibidas na vitrine da loja.
              </p>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5 sm:p-6">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Imagem da categoria
              </span>
              <span className="grid cursor-pointer gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 transition hover:border-zinc-400 sm:grid-cols-[112px_1fr] sm:items-center">
                <span className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200 sm:aspect-square">
                  {form.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.imagemUrl}
                      alt="Prévia da categoria"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <CloudArrowUpIcon className="h-8 w-8" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-bold text-zinc-700">
                    {uploading ? 'Enviando imagem...' : 'Escolher imagem'}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-400">
                    PNG, JPG ou WEBP. Tamanho máximo de 5 MB.
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading || saving}
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleImageUpload(file);
                    event.target.value = '';
                  }}
                />
              </span>
            </label>

            <Field label="Nome">
              <input
                value={form.nome}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    nome: event.target.value,
                  }))
                }
                maxLength={80}
                placeholder="Ex.: Frutas e verduras"
                className="category-input"
              />
            </Field>

            <Field label="Descrição (opcional)">
              <textarea
                value={form.descricao}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    descricao: event.target.value,
                  }))
                }
                maxLength={240}
                rows={3}
                placeholder="Conte brevemente o que o cliente encontra aqui."
                className="category-input min-h-24 resize-none py-3"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ordem de exibição">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.ordem}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ordem: event.target.value,
                    }))
                  }
                  className="category-input"
                />
              </Field>

              <label className="flex h-12 items-center justify-between self-end rounded-xl border border-zinc-200 px-4">
                <span className="text-sm font-semibold text-zinc-700">
                  Categoria ativa
                </span>
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      ativo: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-zinc-950"
                />
              </label>
            </div>

            {error && (
              <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-100 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={closeDialog}
              disabled={saving || uploading}
              className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar categoria'}
            </button>
          </div>
        </form>

        <style jsx global>{`
          .category-input {
            min-height: 3rem;
            width: 100%;
            border-radius: 0.75rem;
            border: 1px solid rgb(228 228 231);
            background: white;
            padding-left: 1rem;
            padding-right: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            color: rgb(9 9 11);
            outline: none;
            transition: all 150ms ease;
          }

          .category-input:focus {
            border-color: rgb(9 9 11);
            box-shadow: 0 0 0 4px rgb(9 9 11 / 0.05);
          }

          dialog::backdrop {
            backdrop-filter: blur(3px);
          }
        `}</style>
      </dialog>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F2FF] text-zinc-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-zinc-950">{value}</p>
        <p className="text-xs font-semibold text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function Notice({
  children,
  tone,
  onClose,
}: {
  children: React.ReactNode;
  tone: 'error' | 'success';
  onClose: () => void;
}) {
  const isError = tone === 'error';
  const Icon = isError ? ExclamationTriangleIcon : CheckCircleIcon;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span className="flex-1">{children}</span>
      <button type="button" onClick={onClose} aria-label="Fechar aviso">
        <XMarkIcon className="h-5 w-5" />
      </button>
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
      <span className="mb-2 block text-sm font-semibold text-zinc-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getBucketFilePath(url: string | null) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${CATEGORY_IMAGES_BUCKET}/`;
  const markerIndex = url.indexOf(marker);
  return markerIndex >= 0
    ? decodeURIComponent(url.slice(markerIndex + marker.length))
    : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;

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
