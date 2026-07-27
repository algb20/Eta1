# Eta — Pi Network Innovation Hub

Eta is a smart platform for showcasing innovations, research and inventions
within the Pi Network ecosystem. It tracks sustainability metrics (carbon
saved, water conserved, energy generated), is fully bilingual (English /
Arabic with RTL), and has **zero financial transactions** — identity is via
Pi Network only.

Built with **Next.js 15 (static export) + Tailwind / shadcn-ui**, backed by
**Supabase** (Postgres + Row Level Security + Edge Functions), deployed on
**Netlify**, and designed to run inside the **Pi Browser**.

---

## What actually works

| Area | Status |
|------|--------|
| Real Pi Network sign-in (verified server-side) | ✅ `pi-login` Edge Function |
| Projects loaded from the database | ✅ `projects` table + public RLS |
| Submit a project (goes to founder review) | ✅ `action` Edge Function |
| Likes & follows (per Pi account) | ✅ `action` Edge Function |
| "Following" feed | ✅ from `project_follows` |
| View counter | ✅ `increment_project_view` RPC |
| Admin dashboard (founder only) | ✅ real stats, approve/classify, feature toggles, verify users |
| Immutable analytics log | ✅ `analytics_events` (anonymous insert, admin read) |
| Bilingual EN/AR + RTL | ✅ `lib/i18n.ts` (hand-written) |
| 20+ more languages | ✅ Google Translate engine (`components/translate-engine.tsx`) |
| Hardware back-button handling | ✅ closes overlays / returns home instead of exiting the app |
| Founder bootstrap (first sign-in) | ✅ `pi-login` (pin with `ETA_FOUNDER_PI_UID`) |

Until a Supabase project is connected, the app gracefully falls back to six
bundled demo projects so the interface is never empty.

---

## Project structure

```
app/                     Next.js app router (single client page + layout)
components/
  pi-provider.tsx        Pi auth context (sign-in, session, likes/follows)
  admin-dashboard.tsx    Founder control panel (real data)
  project-upload.tsx     Submit-a-project form (writes to Supabase)
  team-workspace.tsx     Team spaces (reads from Supabase)
  marketing-intelligence.tsx / onboarding-help.tsx
  ui/                    shadcn-ui primitives
lib/
  config.ts              App + Pi + Edge-Function endpoints (env-driven)
  supabase.ts            Browser Supabase client (anon key)
  api.ts                 All data access (reads + write helpers) + demo data
  i18n.ts                English/Arabic dictionary + direction helper
supabase/
  migrations/            0001_init.sql (schema+RLS), 0002_seed.sql (demo data)
  functions/             pi-login, action, admin  (+ _shared helpers)
netlify.toml             Build config (static export -> out/)
validation-key.txt       Pi domain validation (served at site root)
```

## Security model

* **Reads** use the public anon key and are limited by Row Level Security —
  only approved projects, public profiles and public counters are readable.
* **Writes** never use the anon key. They go through Supabase Edge Functions
  that first verify the caller's Pi access token against
  `https://api.minepi.com/v2/me`, then act with the service role.
* The **founder** is the first account to sign in (or pin one with the
  `ETA_FOUNDER_PI_UID` secret). Only founder/admin roles can reach the admin
  Edge Function.

See **[SETUP.md](./SETUP.md)** for step-by-step deployment instructions.
