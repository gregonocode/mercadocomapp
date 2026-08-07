-- Guarda a coordenada informada voluntariamente pelo cliente para facilitar a entrega.
alter table public.pedidos
  add column if not exists endereco_latitude double precision,
  add column if not exists endereco_longitude double precision,
  add column if not exists localizacao_capturada_em timestamptz;

-- Mantem a funcao original intacta e cria uma camada que persiste os novos dados.
alter function public.criar_pedido(
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
) rename to criar_pedido_sem_localizacao;

create function public.criar_pedido(
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
declare
  v_pedido_id uuid;
  v_numero_pedido bigint;
  v_subtotal numeric;
  v_taxa_entrega numeric;
  v_valor_total numeric;
begin
  select result.pedido_id, result.numero_pedido, result.subtotal, result.taxa_entrega, result.valor_total
  into v_pedido_id, v_numero_pedido, v_subtotal, v_taxa_entrega, v_valor_total
  from public.criar_pedido_sem_localizacao(
    p_mercado_id,
    p_cliente_nome,
    p_cliente_telefone,
    p_tipo_entrega,
    p_forma_pagamento,
    p_itens,
    p_endereco,
    p_cliente_email,
    p_observacao,
    p_troco_para
  ) as result;

  update public.pedidos
  set endereco_latitude = case
        when p_endereco ->> 'latitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
          then (p_endereco ->> 'latitude')::double precision
        else null
      end,
      endereco_longitude = case
        when p_endereco ->> 'longitude' ~ '^-?[0-9]+(\.[0-9]+)?$'
          then (p_endereco ->> 'longitude')::double precision
        else null
      end,
      localizacao_capturada_em = case
        when nullif(trim(p_endereco ->> 'localizacao_capturada_em'), '') is not null
          then (p_endereco ->> 'localizacao_capturada_em')::timestamptz
        else null
      end
  where id = v_pedido_id;

  return query select v_pedido_id, v_numero_pedido, v_subtotal, v_taxa_entrega, v_valor_total;
end;
$$;

revoke all on function public.criar_pedido(
  uuid, text, text, public.tipo_entrega, public.forma_pagamento, jsonb, jsonb, text, text, numeric
) from public;

grant execute on function public.criar_pedido(
  uuid, text, text, public.tipo_entrega, public.forma_pagamento, jsonb, jsonb, text, text, numeric
) to anon, authenticated;
