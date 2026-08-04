'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  IdentificationIcon,
  InformationCircleIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { createClient } from '@/app/lib/supabase/client';

type Mercado = {
  id: string;
  nome: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  cnpj: string | null;
  slug: string;
  descricao: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email_contato: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  pix_chave: string | null;
  pix_nome: string | null;
  pedido_minimo: number | string | null;
  taxa_entrega: number | string | null;
  ativo: boolean;
} | null;

type MercadoOnboardingFormProps = {
  userId: string;
  userEmail: string;
  mercado: Mercado;
};

const estadosBrasileiros = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export default function MercadoOnboardingForm({
  userId,
  userEmail,
  mercado,
}: MercadoOnboardingFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const mercadoJaCriado = Boolean(mercado?.id);

  const [nomeFantasia, setNomeFantasia] = useState(
    mercado?.nome_fantasia || mercado?.nome || '',
  );
  const [razaoSocial, setRazaoSocial] = useState(
    mercado?.razao_social || '',
  );
  const [cnpj, setCnpj] = useState(formatCnpj(mercado?.cnpj || ''));
  const [slug, setSlug] = useState(
    mercado?.slug || slugify(mercado?.nome || ''),
  );
  const [slugEditado, setSlugEditado] = useState(mercadoJaCriado);
  const [descricao, setDescricao] = useState(mercado?.descricao || '');
  const [telefone, setTelefone] = useState(
    formatPhone(mercado?.telefone || ''),
  );
  const [whatsapp, setWhatsapp] = useState(
    formatPhone(mercado?.whatsapp || ''),
  );
  const [emailContato, setEmailContato] = useState(
    mercado?.email_contato || userEmail,
  );
  const [endereco, setEndereco] = useState(mercado?.endereco || '');
  const [cidade, setCidade] = useState(mercado?.cidade || '');
  const [estado, setEstado] = useState(mercado?.estado || '');
  const [cep, setCep] = useState(formatCep(mercado?.cep || ''));
  const [pixChave, setPixChave] = useState(mercado?.pix_chave || '');
  const [pixNome, setPixNome] = useState(mercado?.pix_nome || '');
  const [pedidoMinimo, setPedidoMinimo] = useState(
    mercado?.pedido_minimo?.toString() || '',
  );
  const [taxaEntrega, setTaxaEntrega] = useState(
    mercado?.taxa_entrega?.toString() || '',
  );
  const [ativo, setAtivo] = useState(mercado?.ativo ?? true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        nomeFantasia,
        razaoSocial,
        cnpj,
        slug,
        descricao,
        telefone,
        whatsapp,
        emailContato,
        endereco,
        cidade,
        estado,
        cep,
        pixChave,
        pixNome,
        pedidoMinimo,
        taxaEntrega,
        ativo,
      }),
    [
      nomeFantasia,
      razaoSocial,
      cnpj,
      slug,
      descricao,
      telefone,
      whatsapp,
      emailContato,
      endereco,
      cidade,
      estado,
      cep,
      pixChave,
      pixNome,
      pedidoMinimo,
      taxaEntrega,
      ativo,
    ],
  );
  const [savedSnapshot, setSavedSnapshot] = useState(currentSnapshot);
  const hasUnsavedChanges = currentSnapshot !== savedSnapshot;

  const completionItems = [
    { label: 'Identidade comercial', complete: Boolean(nomeFantasia && slug) },
    {
      label: 'Canal de atendimento',
      complete: Boolean(whatsapp && emailContato),
    },
    {
      label: 'Endereço do mercado',
      complete: Boolean(endereco && cidade && estado && cep),
    },
    { label: 'Recebimento por Pix', complete: Boolean(pixChave && pixNome) },
  ];
  const completedItems = completionItems.filter((item) => item.complete).length;
  const completion = Math.round(
    (completedItems / completionItems.length) * 100,
  );
  const publicPath = `/${slug || 'seu-mercado'}`;

  function handleNomeChange(value: string) {
    setNomeFantasia(value);

    if (!slugEditado) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEditado(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro(null);
    setSucesso(null);

    try {
      validateForm({
        nomeFantasia,
        slug,
        cnpj,
        emailContato,
        estado,
        cep,
      });
      const pedidoMinimoNumber = parseDecimal(pedidoMinimo);
      const taxaEntregaNumber = parseDecimal(taxaEntrega);

      if (
        pedidoMinimo.trim() &&
        (pedidoMinimoNumber === null || pedidoMinimoNumber < 0)
      ) {
        throw new Error('Informe um valor válido para o pedido mínimo.');
      }

      if (taxaEntrega.trim() && (taxaEntregaNumber === null || taxaEntregaNumber < 0)) {
        throw new Error('Informe um valor válido para a taxa de entrega.');
      }

      if (pedidoMinimoNumber === null && taxaEntregaNumber === null) {
        throw new Error(
          'Informe a taxa de entrega quando não houver pedido mínimo para entrega grátis.',
        );
      }

      const payload = {
        proprietario_id: userId,
        nome: nomeFantasia.trim(),
        nome_fantasia: nomeFantasia.trim(),
        razao_social: razaoSocial.trim() || null,
        cnpj: onlyDigits(cnpj) || null,
        slug,
        descricao: descricao.trim() || null,
        telefone: onlyDigits(telefone) || null,
        whatsapp: onlyDigits(whatsapp) || null,
        email_contato: emailContato.trim().toLowerCase() || null,
        endereco: endereco.trim() || null,
        cidade: cidade.trim() || null,
        estado: estado || null,
        cep: onlyDigits(cep) || null,
        pix_chave: pixChave.trim() || null,
        pix_nome: pixNome.trim() || null,
        pedido_minimo: pedidoMinimoNumber,
        taxa_entrega: taxaEntregaNumber,
        ativo,
        updated_at: new Date().toISOString(),
      };

      const { error } = mercado?.id
        ? await supabase
            .from('mercados')
            .update(payload)
            .eq('id', mercado.id)
        : await supabase.from('mercados').insert({
            ...payload,
            plano: 'basic',
          });

      if (error) {
        throw error;
      }

      setSavedSnapshot(currentSnapshot);
      setSucesso(
        mercadoJaCriado
          ? 'Configurações atualizadas com sucesso.'
          : 'Mercado criado. Agora você já pode cadastrar categorias e produtos.',
      );
      router.refresh();
    } catch (error) {
      setErro(getFriendlyError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border border-zinc-200 bg-white px-5 py-6 shadow-sm sm:px-7 lg:px-8 lg:py-8">
        <div className="absolute right-0 top-0 h-48 w-48 -translate-y-1/3 translate-x-1/3 rounded-full bg-[#F4F2FF] blur-2xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-[#F7F7F4] px-3 py-1.5 text-xs font-bold text-zinc-600">
              <BuildingStorefrontIcon className="h-4 w-4" />
              Estrutura do mercado
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-zinc-950 sm:text-4xl">
              {mercadoJaCriado
                ? 'Configurações do mercado'
                : 'Configure seu mercado'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-zinc-500 sm:text-base">
              Organize as informações comerciais, atendimento e recebimento
              que serão usadas no painel e na experiência dos seus clientes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge active={ativo} />
            {mercado?.slug && (
              <Link
                href={`/${mercado.slug}`}
                target="_blank"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                Abrir mercado
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          <SettingsSection
            number="01"
            icon={IdentificationIcon}
            title="Identidade comercial"
            description="Como o mercado será identificado no painel e na vitrine."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Nome fantasia"
                hint="Nome exibido para os clientes."
                required
              >
                <input
                  value={nomeFantasia}
                  onChange={(event) => handleNomeChange(event.target.value)}
                  placeholder="Ex. Mercado Dois Irmãos"
                  required
                  className="input-market"
                />
              </Field>

              <Field label="Razão social" hint="Informação administrativa.">
                <input
                  value={razaoSocial}
                  onChange={(event) => setRazaoSocial(event.target.value)}
                  placeholder="Ex. Dois Irmãos Comércio Ltda."
                  className="input-market"
                />
              </Field>

              <Field label="CNPJ" hint="Somente números ou formato completo.">
                <input
                  value={cnpj}
                  onChange={(event) => setCnpj(formatCnpj(event.target.value))}
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="input-market"
                />
              </Field>

              <Field
                label="Endereço público"
                hint={
                  mercadoJaCriado
                    ? 'Alterar este campo muda o link divulgado.'
                    : 'Criado automaticamente pelo nome.'
                }
                required
              >
                <div className="flex h-[3.25rem] overflow-hidden rounded-2xl border border-zinc-200 bg-white transition focus-within:border-zinc-950 focus-within:ring-4 focus-within:ring-zinc-950/5">
                  <span className="flex items-center border-r border-zinc-200 bg-[#F7F7F4] px-3 text-xs font-bold text-zinc-400">
                    /
                  </span>
                  <input
                    value={slug}
                    onChange={(event) => handleSlugChange(event.target.value)}
                    placeholder="seu-mercado"
                    required
                    className="min-w-0 flex-1 bg-transparent px-3 text-sm font-bold text-zinc-950 outline-none"
                  />
                </div>
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Descrição do mercado"
                  hint="Uma apresentação curta para a vitrine e compartilhamentos."
                >
                  <textarea
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Conte em poucas palavras o que seus clientes encontram no mercado."
                    rows={4}
                    maxLength={240}
                    className="textarea-market"
                  />
                  <p className="mt-2 text-right text-xs font-medium text-zinc-400">
                    {descricao.length}/240
                  </p>
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            number="02"
            icon={PhoneIcon}
            title="Atendimento"
            description="Canais usados para dúvidas, pedidos e comunicação."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="WhatsApp" hint="Canal principal de atendimento.">
                <input
                  value={whatsapp}
                  onChange={(event) =>
                    setWhatsapp(formatPhone(event.target.value))
                  }
                  inputMode="tel"
                  placeholder="(00) 00000-0000"
                  className="input-market"
                />
              </Field>

              <Field label="Telefone alternativo" hint="Campo opcional.">
                <input
                  value={telefone}
                  onChange={(event) =>
                    setTelefone(formatPhone(event.target.value))
                  }
                  inputMode="tel"
                  placeholder="(00) 0000-0000"
                  className="input-market"
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="E-mail de contato"
                  hint="Usado para comunicações com o mercado."
                >
                  <input
                    type="email"
                    value={emailContato}
                    onChange={(event) => setEmailContato(event.target.value)}
                    placeholder="contato@seumercado.com.br"
                    className="input-market"
                  />
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            number="03"
            icon={MapPinIcon}
            title="Localização"
            description="Endereço de referência para retirada e operação."
          >
            <div className="grid gap-5 md:grid-cols-6">
              <div className="md:col-span-6">
                <Field label="Endereço" hint="Rua, número, complemento e bairro.">
                  <input
                    value={endereco}
                    onChange={(event) => setEndereco(event.target.value)}
                    placeholder="Av. Principal, 120 — Centro"
                    className="input-market"
                  />
                </Field>
              </div>

              <div className="md:col-span-3">
                <Field label="Cidade">
                  <input
                    value={cidade}
                    onChange={(event) => setCidade(event.target.value)}
                    placeholder="Sua cidade"
                    className="input-market"
                  />
                </Field>
              </div>

              <div className="md:col-span-1">
                <Field label="UF">
                  <select
                    value={estado}
                    onChange={(event) => setEstado(event.target.value)}
                    className="input-market"
                  >
                    <option value="">UF</option>
                    {estadosBrasileiros.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="CEP">
                  <input
                    value={cep}
                    onChange={(event) => setCep(formatCep(event.target.value))}
                    inputMode="numeric"
                    placeholder="00000-000"
                    maxLength={9}
                    className="input-market"
                  />
                </Field>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            number="04"
            icon={BanknotesIcon}
            title="Recebimento"
            description="Dados do Pix apresentados durante o pagamento."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Chave Pix"
                hint="CPF, CNPJ, e-mail, telefone ou chave aleatória."
              >
                <input
                  value={pixChave}
                  onChange={(event) => setPixChave(event.target.value)}
                  placeholder="Informe a chave de recebimento"
                  className="input-market"
                />
              </Field>

              <Field
                label="Nome do recebedor"
                hint="Nome que o cliente verá antes de pagar."
              >
                <input
                  value={pixNome}
                  onChange={(event) => setPixNome(event.target.value)}
                  placeholder="Nome do titular da conta"
                  className="input-market"
                />
              </Field>

              <div className="md:col-span-2">
                <Field
                  label="Pedido mínimo para entrega grátis"
                  hint="Deixe em branco caso não ofereça entrega grátis por valor mínimo."
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={pedidoMinimo}
                    onChange={(event) => setPedidoMinimo(event.target.value)}
                    placeholder="Ex. 50,00"
                    className="input-market"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Taxa de entrega"
                  hint="Obrigatória quando não houver pedido mínimo para entrega grátis."
                >
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={taxaEntrega}
                    onChange={(event) => setTaxaEntrega(event.target.value)}
                    placeholder="Ex. 8,00"
                    className="input-market"
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <div className="flex gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900">
                  <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  Confira a chave e o nome do titular antes de publicar. Esses
                  dados serão usados para orientar o pagamento do cliente.
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <div className="rounded-[28px] border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">
                  Progresso
                </p>
                <h2 className="mt-1 text-xl font-black text-zinc-950">
                  Configuração {completion}%
                </h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
                <SparklesIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-950 transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="mt-5 space-y-3">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span
                    className={[
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      item.complete
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-zinc-100 text-zinc-400',
                    ].join(' ')}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                  </span>
                  <span
                    className={[
                      'text-sm font-semibold',
                      item.complete ? 'text-zinc-800' : 'text-zinc-400',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="bg-zinc-950 p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                  <BuildingStorefrontIcon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                  Prévia
                </span>
              </div>
              <h3 className="mt-5 truncate text-xl font-black">
                {nomeFantasia || 'Seu mercado'}
              </h3>
              <p className="mt-1 truncate text-sm font-medium text-white/60">
                mercadocomapp.com.br{publicPath}
              </p>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/70">
                {descricao ||
                  'A descrição do seu mercado aparecerá aqui para os clientes.'}
              </p>
            </div>

            <div className="space-y-4 p-5">
              <label className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-zinc-900">
                    Mercado publicado
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    Permite acesso pela URL pública.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(event) => setAtivo(event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-zinc-950"
                />
              </label>

              <div className="h-px bg-zinc-100" />

              <div className="flex items-start gap-3 text-xs leading-5 text-zinc-500">
                <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                As alterações só entram em vigor depois de salvar.
              </div>
            </div>
          </div>

          {(erro || sucesso) && (
            <div aria-live="polite">
              {erro && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-700">
                  {erro}
                </div>
              )}
              {sucesso && (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-5 text-emerald-700">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  {sucesso}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !hasUnsavedChanges}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading
              ? 'Salvando...'
              : mercadoJaCriado
                ? 'Salvar configurações'
                : 'Criar mercado'}
            {!loading && <ArrowRightIcon className="h-4 w-4" />}
          </button>

          {mercadoJaCriado && (
            <Link
              href="/dashboard/configuracoes/identidade-visual"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <GlobeAltIcon className="h-4 w-4" />
              Identidade visual
            </Link>
          )}
        </aside>
      </form>

      <style jsx global>{`
        .input-market,
        .textarea-market {
          width: 100%;
          border: 1px solid rgb(228 228 231);
          background: white;
          color: rgb(9 9 11);
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
        }

        .input-market {
          height: 3.25rem;
          border-radius: 1rem;
          padding: 0 1rem;
        }

        .textarea-market {
          min-height: 7rem;
          resize: vertical;
          border-radius: 1rem;
          padding: 0.875rem 1rem;
          line-height: 1.5rem;
        }

        .input-market::placeholder,
        .textarea-market::placeholder {
          color: rgb(161 161 170);
          font-weight: 500;
        }

        .input-market:focus,
        .textarea-market:focus {
          border-color: rgb(24 24 27);
          box-shadow: 0 0 0 4px rgb(24 24 27 / 0.05);
        }
      `}</style>
    </div>
  );
}

function SettingsSection({
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 border-b border-zinc-100 px-5 py-5 sm:px-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F2FF] text-zinc-950">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black tracking-[0.16em] text-zinc-300">
              {number}
            </span>
            <h2 className="text-lg font-black tracking-tight text-zinc-950">
              {title}
            </h2>
          </div>
          <p className="mt-1 text-sm font-medium leading-5 text-zinc-400">
            {description}
          </p>
        </div>
      </div>
      <div className="px-5 py-6 sm:px-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-bold text-zinc-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      {hint && (
        <span className="mb-2 mt-1 block text-xs font-medium leading-5 text-zinc-400">
          {hint}
        </span>
      )}
      {!hint && <span className="mb-2 block" />}
      {children}
    </label>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        'inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold',
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      <span
        className={[
          'h-2 w-2 rounded-full',
          active ? 'bg-emerald-500' : 'bg-amber-500',
        ].join(' ')}
      />
      {active ? 'Publicado' : 'Não publicado'}
    </span>
  );
}

function validateForm({
  nomeFantasia,
  slug,
  cnpj,
  emailContato,
  estado,
  cep,
}: {
  nomeFantasia: string;
  slug: string;
  cnpj: string;
  emailContato: string;
  estado: string;
  cep: string;
}) {
  if (nomeFantasia.trim().length < 2) {
    throw new Error('Informe um nome fantasia com pelo menos 2 caracteres.');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('O endereço público informado não é válido.');
  }

  const cnpjDigits = onlyDigits(cnpj);
  if (cnpjDigits && cnpjDigits.length !== 14) {
    throw new Error('Confira o CNPJ. Ele deve conter 14 números.');
  }

  if (emailContato && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContato)) {
    throw new Error('Informe um e-mail de contato válido.');
  }

  if (estado && estado.length !== 2) {
    throw new Error('Selecione uma UF válida.');
  }

  const cepDigits = onlyDigits(cep);
  if (cepDigits && cepDigits.length !== 8) {
    throw new Error('Confira o CEP. Ele deve conter 8 números.');
  }
}

function getFriendlyError(error: unknown) {
  const message = getErrorMessage(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('duplicate') || normalized.includes('unique')) {
    if (normalized.includes('cnpj')) {
      return 'Este CNPJ já está vinculado a outro mercado.';
    }

    return 'Este endereço público já está em uso. Escolha outro.';
  }

  if (
    getErrorCode(error) === '23503' ||
    normalized.includes('mercados_proprietario_id_fkey')
  ) {
    return 'Não conseguimos vincular o mercado à sua conta. Entre novamente e tente salvar.';
  }

  return message || 'Não foi possível salvar as configurações do mercado.';
}

function getErrorMessage(error: unknown) {
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

  return '';
}

function getErrorCode(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code;
  }

  return null;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function parseDecimal(value: string) {
  if (!value.trim()) return null;

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCnpj(value: string) {
  return onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCep(value: string) {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
