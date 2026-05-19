-- =============================================================================
-- JUDGEMENTIA — PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND CLICK RUN
-- Open: https://supabase.com/dashboard/project/taztpqmdmryzjlctfvtk/sql/new
-- =============================================================================

-- Tables (fixes: "Could not find the table 'public.rooms' in the schema cache")
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_config jsonb not null default '{"characterId":"kai","skinTone":"ivory","robeColor":"midnight","badgeStyle":"scales","hairStyle":"slick"}'::jsonb,
  cases_won int not null default 0,
  cases_lost int not null default 0
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null check (
    status in ('lobby', 'prosecutor_turn', 'defendant_turn', 'jury_voting', 'verdict')
  ),
  scenario text not null,
  host_id uuid references auth.users (id) on delete set null
);

create table if not exists public.room_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null,
  role text not null check (role in ('prosecutor', 'defendant')),
  primary key (room_id, user_id)
);

create table if not exists public.game_state (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  prosecutor_text text not null default '',
  defendant_text text not null default '',
  guilty_votes int not null default 0,
  not_guilty_votes int not null default 0,
  verdict_json jsonb
);

-- Realtime sync
do $$ begin alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.game_state;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null; end $$;

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.game_state enable row level security;
alter table public.room_players enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

drop policy if exists "rooms_select_all" on public.rooms;
drop policy if exists "rooms_insert_auth" on public.rooms;
drop policy if exists "rooms_update_auth" on public.rooms;
create policy "rooms_select_all" on public.rooms for select using (true);
create policy "rooms_insert_auth" on public.rooms for insert to authenticated with check (auth.uid() is not null);
create policy "rooms_update_auth" on public.rooms for update to authenticated using (auth.uid() is not null);

drop policy if exists "room_players_select_all" on public.room_players;
drop policy if exists "room_players_insert_own" on public.room_players;
drop policy if exists "room_players_update_own" on public.room_players;
create policy "room_players_select_all" on public.room_players for select using (true);
create policy "room_players_insert_own" on public.room_players for insert to authenticated with check (auth.uid() = user_id);
create policy "room_players_update_own" on public.room_players for update to authenticated using (auth.uid() = user_id);

drop policy if exists "game_state_select_all" on public.game_state;
drop policy if exists "game_state_insert_auth" on public.game_state;
drop policy if exists "game_state_update_auth" on public.game_state;
create policy "game_state_select_all" on public.game_state for select using (true);
create policy "game_state_insert_auth" on public.game_state for insert to authenticated with check (auth.uid() is not null);
create policy "game_state_update_auth" on public.game_state for update to authenticated using (auth.uid() is not null);

-- Auto profile + auto-confirm email on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, avatar_config)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(coalesce(new.email, 'counsel@court'), '@', 1), 'Counsel'),
    '{"characterId":"kai","skinTone":"ivory","robeColor":"midnight","badgeStyle":"scales","hairStyle":"slick"}'::jsonb
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.auto_confirm_user_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update auth.users set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;
  return new;
end; $$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm after insert on auth.users
  for each row execute function public.auto_confirm_user_email();

-- Done! Refresh Judgementia and create a room again.
