-- Supabase Schema for Judgementia Game
-- Fixed circular reference by removing current_room_id from profiles
-- Added room_members table to handle many-to-many relationship between rooms and profiles

-- 1. rooms table
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  room_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'waiting', -- waiting, accusation, defense, jury, verdict, finished
  crime_scenario text, -- The ridiculous crime scenario
  created_by uuid references profiles(id) not null
);

-- Enable realtime
alter publication supabase_realtime add table rooms;

-- 2. profiles table (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table profiles;

-- 3. room_members table (many-to-many between rooms and profiles with role)
create table room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  role text not null check (role in ('prosecutor', 'defendant', 'jury')),
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, profile_id) -- One role per profile per room
);

-- Enable realtime
alter publication supabase_realtime add table room_members;

-- 4. arguments table
create table arguments (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  player_id uuid references profiles(id) on delete cascade not null,
  phase text not null, -- accusation or defense
  content text not null,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table arguments;

-- 5. votes table
create table votes (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  jury_member_id uuid references profiles(id) on delete cascade not null,
  vote text not null check (vote in ('guilty', 'not_guilty')),
  voted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(room_id, jury_member_id) -- One vote per jury member per room
);

-- Enable realtime
alter publication supabase_realtime add table votes;

-- 6. judge_verdicts table
create table judge_verdicts (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references rooms(id) on delete cascade not null,
  verdict text not null, -- guilty or not_guilty
  punishment text, -- Absurd punishment if guilty
  reasoning text, -- AI's explanation
  vote_distribution jsonb, -- Jury vote breakdown
  delivered_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table judge_verdicts;