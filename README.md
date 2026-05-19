# Judgementia

Premium court legal thriller multiplayer game built with Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase Realtime, and Gemini AI judge.

## Setup

1. Copy `.env.example` to `.env.local` and fill in Supabase + Gemini keys.
2. Run the SQL in `supabase/schema.sql` on your Supabase project.
3. Install and run:

```bash
npm install
npm run dev
```

## Vercel

Set environment variables in the Vercel project dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`

Build command: `npm run build`
