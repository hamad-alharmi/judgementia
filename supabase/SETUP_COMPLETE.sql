-- =============================================================================
-- JUDGEMENTIA — Run this ENTIRE file once in Supabase → SQL Editor → Run
-- Project: https://supabase.com/dashboard/project/taztpqmdmryzjlctfvtk
-- =============================================================================

-- 1) Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_config jsonb not null default '{"skinTone":"ivory","robeColor":"midnight","badgeStyle":"scales","hairStyle":"slick"}'::jsonb,
  cases_won int not null default 0,
  cases_lost int not null default 0
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null check (
    status in ('lobby', 'prosecutor_turn', 'defendant_turn', 'jury_voting', 'verdict')
  ),
  scenario text not null
);

create table if not exists public.game_state (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  prosecutor_text text not null default '',
  defendant_text text not null default '',
  guilty_votes int not null default 0,
  not_guilty_votes int not null default 0,
  verdict_json jsonb
);

-- 2) Realtime
do $$
begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.game_state;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;

-- 3) RLS
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.game_state enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_upsert_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "rooms_select_all" on public.rooms;
drop policy if exists "rooms_insert_auth" on public.rooms;
drop policy if exists "rooms_update_auth" on public.rooms;

create policy "rooms_select_all" on public.rooms for select using (true);
create policy "rooms_insert_auth" on public.rooms for insert with check (auth.role() = 'authenticated');
create policy "rooms_update_auth" on public.rooms for update using (auth.role() = 'authenticated');

drop policy if exists "game_state_select_all" on public.game_state;
drop policy if exists "game_state_insert_auth" on public.game_state;
drop policy if exists "game_state_update_auth" on public.game_state;

create policy "game_state_select_all" on public.game_state for select using (true);
create policy "game_state_insert_auth" on public.game_state for insert with check (auth.role() = 'authenticated');
create policy "game_state_update_auth" on public.game_state for update using (auth.role() = 'authenticated');

-- 4) Auto-create profile when auth user is created (works without login session)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_config)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'username'), ''),
      split_part(coalesce(new.email, 'counsel@court'), '@', 1),
      'Counsel'
    ),
    '{"skinTone":"ivory","robeColor":"midnight","badgeStyle":"scales","hairStyle":"slick"}'::jsonb
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Auto-confirm email on signup (skip inbox confirmation)
create or replace function public.auto_confirm_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  after insert on auth.users
  for each row
  execute function public.auto_confirm_user_email();
