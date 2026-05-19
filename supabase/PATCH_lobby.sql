-- Run in Supabase SQL Editor after RUN_THIS_FIRST.sql

alter table public.rooms add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.room_players add column if not exists is_ready boolean not null default false;
alter table public.room_players add column if not exists display_name text;

drop policy if exists "rooms_update_host" on public.rooms;
create policy "rooms_update_host" on public.rooms
  for update to authenticated
  using (auth.uid() = host_id or auth.uid() is not null);
