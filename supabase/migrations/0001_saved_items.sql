-- thedigitalwit: "My saved items".
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create table if not exists public.saved_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('calculator', 'media_plan', 'gtm_plan')),
  title       text not null check (char_length(title) between 1 and 120),
  path        text not null check (path like '/%'),
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

create index if not exists saved_items_user_created_idx on public.saved_items (user_id, created_at desc);

-- Row-level security: every signed-in user sees and changes only their own rows.
alter table public.saved_items enable row level security;

drop policy if exists "Read own saved items" on public.saved_items;
create policy "Read own saved items" on public.saved_items
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Create own saved items" on public.saved_items;
create policy "Create own saved items" on public.saved_items
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Delete own saved items" on public.saved_items;
create policy "Delete own saved items" on public.saved_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Cap each account at 500 saved items to keep the free tier healthy.
create or replace function public.saved_items_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.saved_items where user_id = new.user_id) >= 500 then
    raise exception 'Saved item limit reached (500). Delete some items first.';
  end if;
  return new;
end $$;

drop trigger if exists saved_items_limit on public.saved_items;
create trigger saved_items_limit before insert on public.saved_items
  for each row execute function public.saved_items_limit();
