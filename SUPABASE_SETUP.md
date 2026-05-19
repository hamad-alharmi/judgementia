# Supabase setup for Judgementia

Sign-up fails without this one-time configuration.

## Step 1 — Run SQL (required)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/taztpqmdmryzjlctfvtk/sql/new)
2. Paste the full contents of **`supabase/SETUP_COMPLETE.sql`**
3. Click **Run**

This creates tables, realtime, RLS policies, auto-profile creation, and auto-email-confirmation.

## Step 2 — Auth URLs (required)

Go to **Authentication → URL Configuration**:

| Field | Value |
|--------|--------|
| **Site URL** | Your Vercel URL, e.g. `https://judgementia.vercel.app` |
| **Redirect URLs** | Add both: |
| | `http://localhost:3000/auth/callback` |
| | `https://YOUR-VERCEL-APP.vercel.app/auth/callback` |

## Step 3 — Email provider (required)

**Authentication → Providers → Email**

- Ensure **Email** is **enabled**
- Ensure **Enable sign ups** is **on**
- Optional: turn **off** “Confirm email” if you prefer manual confirmation (Step 1 SQL already auto-confirms)

## Step 4 — Vercel env vars

In your Vercel project → **Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://taztpqmdmryzjlctfvtk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
GEMINI_API_KEY=<your key>
NEXT_PUBLIC_SITE_URL=https://YOUR-VERCEL-APP.vercel.app
```

Redeploy after saving.

## Step 5 — Test

1. Use a **new email** you have not signed up with before
2. Sign up → you should enter the court (gavel animation → main menu)
3. If you already signed up earlier, use **Login** instead

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Sign up failed” / no user returned | Email may already exist → try **Login**, or use a new email |
| “Email not confirmed” | Re-run `SETUP_COMPLETE.sql` (auto-confirm trigger) |
| Redirect error | Add your Vercel `/auth/callback` URL in Step 2 |
| Profile errors | Re-run `SETUP_COMPLETE.sql` (creates `profiles` + trigger) |
