-- Judgementia Supabase schema (run in SQL editor)

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
    status in (
      'lobby',
      'prosecutor_turn',
      'defendant_turn',
      'jury_voting',
      'verdict'
    )
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

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.game_state;
alter publication supabase_realtime add table public.profiles;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.game_state enable row level security;

create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_upsert_own" on public.profiles for all using (auth.uid() = id);

create policy "rooms_select_all" on public.rooms for select using (true);
create policy "rooms_insert_auth" on public.rooms for insert with check (auth.role() = 'authenticated');
create policy "rooms_update_auth" on public.rooms for update using (auth.role() = 'authenticated');

create policy "game_state_select_all" on public.game_state for select using (true);
create policy "game_state_insert_auth" on public.game_state for insert with check (auth.role() = 'authenticated');
create policy "game_state_update_auth" on public.game_state for update using (auth.role() = 'authenticated');
