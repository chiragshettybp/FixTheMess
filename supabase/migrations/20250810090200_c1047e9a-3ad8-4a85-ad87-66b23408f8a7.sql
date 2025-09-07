-- Ensure ads bucket exists and is public
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;

-- Storage policies for 'ads' bucket
create policy if not exists "Public read for ads bucket"
  on storage.objects
  for select
  using (bucket_id = 'ads');

create policy if not exists "Users can upload to their ads folder"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'ads' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can update their own ads files"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'ads' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy if not exists "Users can delete their own ads files"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'ads' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS for ads table: allow superadmin full access, authenticated can read
alter table if exists public.ads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ads' and policyname = 'Ads are viewable by authenticated users'
  ) then
    create policy "Ads are viewable by authenticated users" on public.ads for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ads' and policyname = 'Superadmin can manage ads'
  ) then
    create policy "Superadmin can manage ads" on public.ads for all to authenticated
    using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'superadmin'))
    with check (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'superadmin'));
  end if;
end $$;