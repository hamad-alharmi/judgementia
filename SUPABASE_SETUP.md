# Fix: "Could not find the table 'public.rooms'"

That error means **no Judgementia tables exist** in your Supabase project yet. The app cannot create rooms until you run the SQL below **once**.

## Step-by-step (2 minutes)

1. **Log in** to [Supabase](https://supabase.com/dashboard/project/taztpqmdmryzjlctfvtk)
2. Open **SQL Editor** (left sidebar) → **New query**
3. Open this file in your project: **`supabase/RUN_THIS_FIRST.sql`**
4. **Select all** (Ctrl+A) → **Copy** → **Paste** into the SQL Editor
5. Click **Run** (or Ctrl+Enter)
6. You should see **Success. No rows returned**
7. Open **Table Editor** — you should see: `profiles`, `rooms`, `room_players`, `game_state`
8. **Hard-refresh** Judgementia (Ctrl+Shift+R) and try **Generate 4-Letter Code** again

Direct link to SQL Editor:  
https://supabase.com/dashboard/project/taztpqmdmryzjlctfvtk/sql/new

## Auth URLs (after tables work)

**Authentication → URL Configuration**

- Site URL: your Vercel URL
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR-APP.vercel.app/auth/callback`

## Vercel environment variables

```
NEXT_PUBLIC_SUPABASE_URL=https://taztpqmdmryzjlctfvtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase → Settings → API>
GEMINI_API_KEY=<your key>
NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app
```

## Still stuck?

In Supabase **Table Editor**, if `rooms` is missing, the SQL did not run on **this** project. Confirm the project URL matches `taztpqmdmryzjlctfvtk` in your `.env.local` / Vercel env vars.
