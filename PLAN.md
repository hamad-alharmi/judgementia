# Judgementia Project Plan

## 📁 File Structure Tree

```
judgementia/
├── app/
│   ├── api/
│   │   ├── judge/
│   │   │   └── route.ts          # Gemini AI Judge endpoint
│   │   ├── rooms/
│   │   │   ├── [roomId]/
│   │   │   │   └── route.ts      # Room-specific API (realtime updates)
│   │   │   └── route.ts          # Room creation/joining
│   │   └── votes/
│   │       └── route.ts          # Vote submission endpoint
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx        # Reusable button component
│   │   │   ├── Input.tsx         # Reusable input component
│   │   │   ├── Timer.tsx         # Countdown timer component
│   │   │   └── Avatar.tsx        # Player avatar component
│   │   ├── lobby/
│   │   │   ├── RoomCodeInput.tsx # Join room via code
│   │   │   └── CreateRoomBtn.tsx # Create new room button
│   │   ├── courtroom/
│   │   │   ├── AccusationPhase.tsx # Prosecutor's turn
│   │   │   ├── DefensePhase.tsx    # Defendant's turn
│   │   │   ├── JuryDeliberation.tsx # Jury voting
│   │   │   └── VerdictDisplay.tsx  # AI Judge verdict display
│   │   └── layout.tsx            # Root layout
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client initialization
│   │   └── gemini.ts             # Gemini AI service wrapper
│   ├── types/
│   │   ├── game.ts               # Game state types
│   │   ├── supabase.ts           # Supabase database types
│   │   └── gemini.ts             # Gemini AI response types
│   ├── globals.css               # Tailwind CSS base styles
│   ├── layout.tsx                # Root layout (App Router)
│   └── page.tsx                  # Home page / lobby selector
├── public/
│   └── favicon.ico               # Favicon
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
├── README.md                     # Project documentation
└── .env.local                    # Environment variables (supabase & gemini keys)
```

## 🗄️ Supabase Database Schema Layout

### 1. `rooms` table
Stores game rooms/lobbies
```sql
create table rooms (
  id uuid primary key default uuid_generate_v4(),
  room_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'waiting', -- waiting, accusation, defense, jury, verdict, finished
  crime_scenario text, -- The ridiculous crime scenario
  prosecutor_id uuid references profiles(id),
  defendant_id uuid references profiles(id),
  created_by uuid references profiles(id) not null
);

-- Enable realtime
alter publication supabase_realtime add table rooms;
```

### 2. `profiles` table (extends Supabase auth.users)
Stores player information
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null,
  avatar_url text,
  current_room_id uuid references rooms(id),
  role text, -- prosecutor, defendant, jury, judge
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable realtime
alter publication supabase_realtime add table profiles;
```

### 3. `arguments` table
Stores prosecutor and defendant arguments
```sql
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
```

### 4. `votes` table
Stores jury votes
```sql
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
```

### 5. `judge_verdicts` table
Stores AI Judge verdicts
```sql
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
```

## 🛠️ Next Steps (Code Mode)
1. Initialize Next.js project with TypeScript
2. Install Tailwind CSS and dependencies
3. Set up Supabase client
4. Implement database wrapper functions
5. Create game loop components
6. Style with atmospheric dark theme
7. Implement Gemini AI integration
8. Ensure Vercel build safety with useEffect scoping