'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CloudArrowUpIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  ShoppingBagIcon,
  TagIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';

const PRODUCT_IMAGES_BUCKET = 'mercado-assets';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type Loja = {
  id: string;
  nome: string;
  slug: string;
};

type Categoria = {
  id: string;
  nome: string;
};

type ProdutoFormProps = {
  loja: Loja;
  userId: string;
  categorias: Categoria[];
};

export default function ProdutoForm({
  loja,
  userId,
  categorias,
}: ProdutoFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState(categorias[0]?.id || '');
  const [marca, setMarca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [precoPromocional, setPrecoPromocional] = useState('');
  const [estoque, setEstoque] = useState('0');
  const [imagemUrl, setImagemUrl] = useState('');
  const [enviarImagem, setEnviarImagem] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const precoNumber = useMemo(() => parseMoney(preco), [preco]);
  const precoPromocionalNumber = useMemo(
    () => parseMoney(precoPromocional),
    [precoPromocional],
  );
  const precoAtual = precoPromocionalNumber || precoNumber;

  async function handleImageUpload(file: File) {
    setErro(null);
    setSucesso(null);

    const extension = IMAGE_EXTENSIONS[file.type];

    if (!extension) {
      setErro('Envie uma imagem PNG, JPG ou WEBP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErro('A imagem precisa ter no máximo 5 MB.');
      return;
    }

    setUploadingImage(true);

    try {
      const filePath = `${userId}/produtos/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .getPublicUrl(filePath);

      setImagemUrl(data.publicUrl);
      setSucesso('Imagem enviada. Finalize o cadastro para salvar o produto.');
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível enviar a imagem.'));
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(null);

    try {
      if (!nome.trim()) {
        throw new Error('Informe o nome do produto.');
      }

      if (!categoriaId) {
        throw new Error('Selecione uma categoria para o produto.');
      }

      if (precoNumber <= 0) {
        throw new Error('Informe um preço válido para o produto.');
      }

      if (
        precoPromocional.trim() &&
        (precoPromocionalNumber <= 0 ||
          precoPromocionalNumber >= precoNumber)
      ) {
        throw new Error(
          'O preço promocional deve ser maior que zero e menor que o preço normal.',
        );
      }

      const estoqueNumber = Number(estoque || 0);

      if (!Number.isInteger(estoqueNumber) || estoqueNumber < 0) {
        throw new Error('Informe uma quantidade de estoque válida.');
      }

      if (imagemUrl.trim() && !isValidImageUrl(imagemUrl)) {
        throw new Error('Informe um link de imagem válido.');
      }

      const { error } = await supabase.from('produtos').insert({
        mercado_id: loja.id,
        categoria_id: categoriaId,
        nome: nome.trim(),
        slug: slugify(nome),
        marca: marca.trim() || null,
        descricao: descricao.trim() || null,
        preco: precoNumber,
        preco_promocional: precoPromocional.trim()
          ? precoPromocionalNumber
          : null,
        imagem_url: imagemUrl || null,
        estoque: estoqueNumber,
        ativo,
        destaque,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      setSucesso('Produto cadastrado com sucesso.');
      router.push('/dashboard/produtos');
      router.refresh();
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível cadastrar o produto.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F4] px-3 py-1 text-xs font-semibold text-zinc-600">
            <span className="h-2 w-2 rounded-full bg-[#F4F2FF]" />
            Cadastro de produto
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl lg:text-4xl">
            Novo produto
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500">
            Adicione as informações que o cliente verá no catálogo da{' '}
            {loja.nome}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/produtos"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar
          </Link>
          <Link
            href={`/${loja.slug}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Ver loja
            <CursorArrowRaysIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-5">
          <SectionCard
            icon={TagIcon}
            title="Dados principais"
            description="Categoria, nome, marca e descrição do item."
          >
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Categoria">
                  <select
                    value={categoriaId}
                    onChange={(event) => setCategoriaId(event.target.value)}
                    required
                    className="input-product"
                  >
                    {categorias.length === 0 && (
                      <option value="">Nenhuma categoria disponível</option>
                    )}
                    {categorias.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                {categorias.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Cadastre ao menos uma categoria antes de criar produtos.
                  </p>
                )}
              </div>
              <Field label="Nome do produto">
                <input
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex. Camiseta oversized"
                  required
                  className="input-product"
                />
              </Field>
              <Field label="Marca">
                <input
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                  placeholder="Ex. Velune"
                  className="input-product"
                />
              </Field>
              <label className="flex min-h-12 items-center justify-between gap-4 self-end rounded-2xl border border-zinc-200 bg-[#F7F7F4] px-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Produto em destaque
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    Exibir na seção de destaques da loja.
                  </p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  checked={destaque}
                  onChange={(event) => setDestaque(event.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-zinc-300 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:bg-zinc-950 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-zinc-950/10"
                />
              </label>
              <div className="md:col-span-2">
                <Field label="Descrição">
                  <textarea
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Detalhes, composição, medidas ou qualquer informação importante."
                    rows={5}
                    className="min-h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-950 outline-none transition placeholder:text-zinc-300 focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
                  />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={BanknotesIcon}
            title="Preço e estoque"
            description="Valores exibidos na vitrine e disponibilidade."
          >
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <Field label="Preço normal">
                <input
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  placeholder="Ex. 129,90"
                  inputMode="decimal"
                  required
                  className="input-product"
                />
              </Field>
              <Field label="Preço promocional">
                <input
                  value={precoPromocional}
                  onChange={(event) => setPrecoPromocional(event.target.value)}
                  placeholder="Ex. 99,90"
                  inputMode="decimal"
                  className="input-product"
                />
              </Field>
              <Field label="Estoque">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={estoque}
                  onChange={(event) => setEstoque(event.target.value)}
                  className="input-product"
                />
              </Field>

              <label className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-[#F7F7F4] px-4 md:col-span-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Produto ativo na loja
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-zinc-400">
                    O produto ficará disponível na vitrine após o cadastro.
                  </p>
                </div>
                <input
                  type="checkbox"
                  role="switch"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-zinc-300 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:bg-zinc-950 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-zinc-950/10"
                />
              </label>
            </div>
          </SectionCard>

          <SectionCard
            icon={PhotoIcon}
            title="Imagem do produto"
            description="Envie a foto principal exibida no catálogo."
          >
            <div className="mt-6 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl bg-[#F7F7F4] text-zinc-400 ring-1 ring-zinc-200">
                {imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagemUrl}
                    alt="Imagem do produto"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PhotoIcon className="h-10 w-10" />
                )}
              </div>

              <div className="flex flex-col justify-center">
                <Field label="Link da imagem">
                  <input
                    type="url"
                    value={imagemUrl}
                    onChange={(event) => setImagemUrl(event.target.value)}
                    placeholder="https://exemplo.com/produto.jpg"
                    disabled={uploadingImage}
                    className="input-product"
                  />
                </Field>

                <label className="mt-4 flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-[#F7F7F4] px-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">
                      Enviar imagem
                    </p>
                    <p className="mt-0.5 text-xs font-normal text-zinc-400">
                      Se preferir, selecione um arquivo do seu dispositivo.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={enviarImagem}
                    onChange={(event) => setEnviarImagem(event.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="relative h-7 w-12 shrink-0 rounded-full bg-zinc-300 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition peer-checked:bg-zinc-950 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-zinc-950/10"
                  />
                </label>

                {enviarImagem && (
                  <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-[#FBFBFA] px-5 py-6 text-center transition hover:border-zinc-400 hover:bg-[#F7F7F4]">
                  <CloudArrowUpIcon className="h-8 w-8 text-zinc-400" />
                  <span className="mt-3 text-sm font-semibold text-zinc-800">
                    {uploadingImage ? 'Enviando imagem...' : 'Selecionar imagem'}
                  </span>
                  <span className="mt-1 text-xs font-normal text-zinc-400">
                    PNG, JPG ou WEBP · máximo de 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={uploadingImage}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void handleImageUpload(file);
                      }

                      event.target.value = '';
                    }}
                  />
                </label>
                )}

                {imagemUrl && (
                  <button
                    type="button"
                    onClick={() => setImagemUrl('')}
                    className="mt-3 flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remover do produto
                  </button>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <aside>
          <div className="sticky top-24 rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Prévia
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
              Card do produto
            </h2>

            <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#F7F7F4] text-zinc-400">
                {imagemUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagemUrl}
                    alt={nome || 'Produto'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CubeIcon className="h-12 w-12" />
                )}
                {!ativo && (
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold text-zinc-600 shadow-sm backdrop-blur">
                    Inativo
                  </span>
                )}
              </div>

              <div className="px-1 pb-1 pt-4">
                <p className="text-xs font-semibold uppercase text-zinc-400">
                  {marca || 'Produto'}
                </p>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-zinc-950">
                  {nome || 'Nome do produto'}
                </h3>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <p className="text-lg font-bold text-zinc-950">
                    {formatCurrency(precoAtual)}
                  </p>
                  {precoPromocionalNumber > 0 && (
                    <p className="pb-0.5 text-xs font-medium text-zinc-300 line-through">
                      {formatCurrency(precoNumber)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {erro && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {erro}
              </div>
            )}
            {sucesso && (
              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                {sucesso}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploadingImage || categorias.length === 0}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Cadastrar produto'}
              {!loading && <ArrowRightIcon className="h-4 w-4" />}
            </button>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#F7F7F4] px-4 py-3">
              <ShoppingBagIcon className="h-5 w-5 shrink-0 text-zinc-400" />
              <p className="text-xs font-medium leading-5 text-zinc-500">
                O produto será vinculado à {loja.nome} e à categoria
                selecionada.
              </p>
            </div>
          </div>
        </aside>
      </form>

      <style jsx global>{`
        .input-product {
          height: 3rem;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(228 228 231);
          background: white;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgb(9 9 11);
          outline: none;
          transition: all 150ms ease;
        }

        .input-product::placeholder {
          color: rgb(212 212 216);
        }

        .input-product:focus {
          border-color: rgb(9 9 11);
          box-shadow: 0 0 0 4px rgb(9 9 11 / 0.05);
        }
      `}</style>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm lg:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-950">
            {title}
          </h2>
          <p className="text-sm font-normal text-zinc-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
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

function parseMoney(value: string) {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function slugify(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `produto-${crypto.randomUUID().slice(0, 8)}`;
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
