# Eta — Setup & Deployment

Follow these steps to take Eta from the repository to a live Pi app. The app
is intentionally decoupled from any specific database — everything is driven
by a few environment variables, so you can point it at any Supabase project.

---

## 1. Create / choose a Supabase project

Any Supabase project works. From **Project Settings → API** note:

* `Project URL`      → becomes `NEXT_PUBLIC_SUPABASE_URL`
* `anon public key`  → becomes `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Apply the database schema

In the Supabase dashboard open **SQL Editor** and run, in order:

1. `supabase/migrations/0001_init.sql`  — tables, RLS policies, view RPC
2. `supabase/migrations/0002_seed.sql`  — six demo projects (optional)

(Or with the CLI: `supabase db push`.)

## 3. Deploy the Edge Functions

The three functions are the authenticated write gateway. They must be
deployed **with JWT verification turned OFF** (they implement their own Pi
token verification):

```bash
supabase functions deploy pi-login --no-verify-jwt
supabase functions deploy action   --no-verify-jwt
supabase functions deploy admin    --no-verify-jwt
```

They automatically receive `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

**Optional — pin the founder** (otherwise the first account to sign in
becomes founder):

```bash
supabase secrets set ETA_FOUNDER_PI_UID=<your-pi-uid>
```

## 4. Configure the frontend environment

Locally, copy `.env.example` → `.env.local` and fill in the two
`NEXT_PUBLIC_SUPABASE_*` values. On **Netlify** set the same variables under
**Site settings → Environment variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
| `NEXT_PUBLIC_PI_SANDBOX` | `false` for production |

## 5. Deploy on Netlify

`netlify.toml` is already configured:

* Build command: `pnpm build`
* Publish directory: `out`

Point the Netlify site at this repository / the `claude/app-development-odu4t3`
branch and deploy. The static export is served directly and the Pi
`validation-key.txt` is reachable at the site root.

## 6. Pi Developer Portal

1. Register / open the Eta app in the Pi Developer Portal.
2. Set the app URL to your Netlify (or `*.pinet.com`) domain.
3. Confirm domain ownership using `validation-key.txt` (already at the root).
4. Keep **sandbox off** for the production app.

## 7. First run

Open the app inside the **Pi Browser** and tap **Connect**. The first account
to sign in is promoted to **founder** and gains the admin dashboard, where you
can review submitted projects, classify them, verify users and toggle
platform features (AI phases, live streaming).

---

### Local development

```bash
pnpm install
pnpm dev          # http://localhost:3000  (uses demo data until Supabase is set)
pnpm build        # static export into ./out
```

Pi authentication only completes inside the Pi Browser (the SDK is blocked
elsewhere), but the whole UI, demo data and language switching work in any
browser for development.
