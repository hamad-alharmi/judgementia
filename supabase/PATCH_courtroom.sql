-- Run if you already ran SETUP_COMPLETE.sql before courtroom update

alter table public.rooms add column if not exists host_id uuid references auth.users (id) on delete set null;

create table if not exists public.room_players (
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  character_id text not null,
  role text not null check (role in ('prosecutor', 'defendant')),
  primary key (room_id, user_id)
);

alter table public.room_players enable row level security;

drop policy if exists "rooms_insert_auth" on public.rooms;
drop policy if exists "rooms_update_auth" on public.rooms;
drop policy if exists "game_state_insert_auth" on public.game_state;
drop policy if exists "game_state_update_auth" on public.game_state;

create policy "rooms_insert_auth" on public.rooms for insert to authenticated with check (auth.uid() is not null);
create policy "rooms_update_auth" on public.rooms for update to authenticated using (auth.uid() is not null);
create policy "game_state_insert_auth" on public.game_state for insert to authenticated with check (auth.uid() is not null);
create policy "game_state_update_auth" on public.game_state for update to authenticated using (auth.uid() is not null);

drop policy if exists "room_players_select_all" on public.room_players;
drop policy if exists "room_players_insert_own" on public.room_players;
drop policy if exists "room_players_update_own" on public.room_players;

create policy "room_players_select_all" on public.room_players for select using (true);
create policy "room_players_insert_own" on public.room_players for insert to authenticated with check (auth.uid() = user_id);
create policy "room_players_update_own" on public.room_players for update to authenticated using (auth.uid() = user_id);

do $$
begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null;
end $$;
