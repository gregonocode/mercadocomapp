-- Bucket público para as imagens exibidas nas categorias da vitrine.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'categoria-imagens',
  'categoria-imagens',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Imagens de categorias são públicas" on storage.objects;
create policy "Imagens de categorias são públicas"
on storage.objects for select
to public
using (bucket_id = 'categoria-imagens');

drop policy if exists "Lojistas enviam imagens de categorias" on storage.objects;
create policy "Lojistas enviam imagens de categorias"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'categoria-imagens'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Lojistas atualizam imagens de categorias" on storage.objects;
create policy "Lojistas atualizam imagens de categorias"
on storage.objects for update
to authenticated
using (
  bucket_id = 'categoria-imagens'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'categoria-imagens'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Lojistas excluem imagens de categorias" on storage.objects;
create policy "Lojistas excluem imagens de categorias"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'categoria-imagens'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
