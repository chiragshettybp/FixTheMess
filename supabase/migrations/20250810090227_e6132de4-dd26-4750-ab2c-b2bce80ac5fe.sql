-- Ensure ads bucket exists and is public
insert into storage.buckets (id, name, public)
values ('ads', 'ads', true)
on conflict (id) do nothing;

-- Storage policies for 'ads' bucket (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read for ads bucket'
  ) THEN
    CREATE POLICY "Public read for ads bucket" ON storage.objects FOR SELECT USING (bucket_id = 'ads');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload to their ads folder'
  ) THEN
    CREATE POLICY "Users can upload to their ads folder" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'ads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own ads files'
  ) THEN
    CREATE POLICY "Users can update their own ads files" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'ads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own ads files'
  ) THEN
    CREATE POLICY "Users can delete their own ads files" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'ads' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

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