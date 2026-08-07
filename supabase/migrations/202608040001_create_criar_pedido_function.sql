-- Cria pedidos públicos de forma atômica. Os valores dos produtos e do frete
-- são sempre recalculados no banco; nenhum total enviado pelo cliente é usado.

alter table public.pedidos
  add column if not exists endereco_latitude double precision,
  add column if not exists endereco_longitude double precision,
  add column if not exists localizacao_capturada_em timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'pedidos_mercado_numero_pedido_key'
  ) then
    alter table public.pedidos
      add constraint pedidos_mercado_numero_pedido_key
      unique (mercado_id, numero_pedido);
  end if;
end;
$$;

create or replace function public.criar_pedido(
  p_mercado_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text,
  p_tipo_entrega public.tipo_entrega,
  p_forma_pagamento public.forma_pagamento,
  p_itens jsonb,
  p_endereco jsonb default '{}'::jsonb,
  p_cliente_email text default null,
  p_observacao text default null,
  p_troco_para numeric default null
)
returns table (
  pedido_id uuid,
  numero_pedido bigint,
  subtotal numeric,
  taxa_entrega numeric,
  valor_total numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_mercado public.mercados%rowtype;
  v_produto public.produtos%rowtype;
  v_item record;
  v_numero_pedido bigint;
  v_subtotal numeric := 0;
  v_taxa_entrega numeric := 0;
  v_valor_total numeric := 0;
  v_preco_unitario numeric;
  v_item_subtotal numeric;
  v_itens_validados jsonb := '[]'::jsonb;
  v_pedido_id uuid;
begin
  if p_mercado_id is null then
    raise exception 'Mercado inválido.';
  end if;

  if coalesce(trim(p_cliente_nome), '') = '' then
    raise exception 'Informe o nome do cliente.';
  end if;

  if coalesce(trim(p_cliente_telefone), '') = '' then
    raise exception 'Informe o telefone do cliente.';
  end if;

  if p_tipo_entrega is null or p_forma_pagamento is null then
    raise exception 'Informe entrega e forma de pagamento.';
  end if;

  if jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Adicione ao menos um item ao pedido.';
  end if;

  select *
  into v_mercado
  from public.mercados
  where id = p_mercado_id
    and ativo = true;

  if not found then
    raise exception 'Mercado não encontrado ou indisponível.';
  end if;

  for v_item in
    select item.produto_id, sum(item.quantidade) as quantidade
    from jsonb_to_recordset(p_itens) as item(produto_id uuid, quantidade numeric)
    group by item.produto_id
  loop
    if v_item.produto_id is null
      or v_item.quantidade is null
      or v_item.quantidade <= 0
      or v_item.quantidade <> trunc(v_item.quantidade) then
      raise exception 'Há um item com quantidade inválida.';
    end if;

    select *
    into v_produto
    from public.produtos
    where id = v_item.produto_id
      and mercado_id = p_mercado_id
      and ativo = true
    for update;

    if not found then
      raise exception 'Um dos produtos não está mais disponível.';
    end if;

    if v_produto.estoque < v_item.quantidade then
      raise exception 'Estoque insuficiente para o produto "%".', v_produto.nome;
    end if;

    v_preco_unitario := coalesce(v_produto.preco_promocional, v_produto.preco);

    if v_preco_unitario is null or v_preco_unitario <= 0 then
      raise exception 'O produto "%" possui preço inválido.', v_produto.nome;
    end if;

    v_item_subtotal := v_preco_unitario * v_item.quantidade;
    v_subtotal := v_subtotal + v_item_subtotal;
    v_itens_validados := v_itens_validados || jsonb_build_array(
      jsonb_build_object(
        'produto_id', v_produto.id,
        'produto_nome', v_produto.nome,
        'produto_imagem_url', v_produto.imagem_url,
        'quantidade', v_item.quantidade,
        'unidade', v_produto.unidade::text,
        'preco_unitario', v_preco_unitario,
        'subtotal', v_item_subtotal
      )
    );

    update public.produtos
    set estoque = estoque - v_item.quantidade,
        updated_at = now()
    where id = v_produto.id;
  end loop;

  if p_tipo_entrega = 'delivery' then
    if coalesce(trim(p_endereco ->> 'rua'), '') = ''
      or coalesce(trim(p_endereco ->> 'numero'), '') = ''
      or coalesce(trim(p_endereco ->> 'bairro'), '') = ''
      or coalesce(trim(p_endereco ->> 'cidade'), '') = ''
      or coalesce(trim(p_endereco ->> 'estado'), '') = '' then
      raise exception 'Informe o endereço completo para entrega.';
    end if;

    if v_mercado.pedido_minimo is null
      or v_subtotal < v_mercado.pedido_minimo then
      if v_mercado.taxa_entrega is null then
        raise exception 'A taxa de entrega deste mercado ainda não foi configurada.';
      end if;

      v_taxa_entrega := v_mercado.taxa_entrega;
    end if;
  end if;

  v_valor_total := v_subtotal + v_taxa_entrega;

  if p_forma_pagamento = 'dinheiro'
    and p_troco_para is not null
    and p_troco_para < v_valor_total then
    raise exception 'O valor para troco precisa ser igual ou maior que o total.';
  end if;

  insert into public.pedidos (
    mercado_id,
    status,
    tipo_entrega,
    forma_pagamento,
    subtotal,
    taxa_entrega,
    valor_total,
    troco_para,
    cliente_nome,
    cliente_telefone,
    cliente_email,
    endereco_cep,
    endereco_rua,
    endereco_numero,
    endereco_bairro,
    endereco_cidade,
    endereco_estado,
    endereco_complemento,
    endereco_referencia,
    endereco_latitude,
    endereco_longitude,
    localizacao_capturada_em,
    observacao
  )
  values (
    p_mercado_id,
    'pendente',
    p_tipo_entrega,
    p_forma_pagamento,
    v_subtotal,
    v_taxa_entrega,
    v_valor_total,
    case when p_forma_pagamento = 'dinheiro' then p_troco_para else null end,
    trim(p_cliente_nome),
    trim(p_cliente_telefone),
    nullif(trim(p_cliente_email), ''),
    nullif(trim(p_endereco ->> 'cep'), ''),
    nullif(trim(p_endereco ->> 'rua'), ''),
    nullif(trim(p_endereco ->> 'numero'), ''),
    nullif(trim(p_endereco ->> 'bairro'), ''),
    nullif(trim(p_endereco ->> 'cidade'), ''),
    nullif(trim(p_endereco ->> 'estado'), ''),
    nullif(trim(p_endereco ->> 'complemento'), ''),
    nullif(trim(p_endereco ->> 'referencia'), ''),
    case
      when p_endereco ->> 'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
        then (p_endereco ->> 'latitude')::double precision
      else null
    end,
    case
      when p_endereco ->> 'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
        then (p_endereco ->> 'longitude')::double precision
      else null
    end,
    case
      when nullif(trim(p_endereco ->> 'localizacao_capturada_em'), '') is not null
        then (p_endereco ->> 'localizacao_capturada_em')::timestamptz
      else null
    end,
    nullif(trim(p_observacao), '')
  )
  returning id, numero_pedido into v_pedido_id, v_numero_pedido;

  insert into public.pedido_itens (
    pedido_id,
    produto_id,
    produto_nome,
    produto_imagem_url,
    quantidade,
    unidade,
    preco_unitario,
    subtotal
  )
  select
    v_pedido_id,
    item.produto_id,
    item.produto_nome,
    item.produto_imagem_url,
    item.quantidade,
    item.unidade::public.unidade_venda,
    item.preco_unitario,
    item.subtotal
  from jsonb_to_recordset(v_itens_validados) as item(
    produto_id uuid,
    produto_nome text,
    produto_imagem_url text,
    quantidade numeric,
    unidade text,
    preco_unitario numeric,
    subtotal numeric
  );

  return query
  select v_pedido_id, v_numero_pedido, v_subtotal, v_taxa_entrega, v_valor_total;
end;
$$;

revoke all on function public.criar_pedido(
  uuid,
  text,
  text,
  public.tipo_entrega,
  public.forma_pagamento,
  jsonb,
  jsonb,
  text,
  text,
  numeric
) from public;

grant execute on function public.criar_pedido(
  uuid,
  text,
  text,
  public.tipo_entrega,
  public.forma_pagamento,
  jsonb,
  jsonb,
  text,
  text,
  numeric
) to anon, authenticated;
