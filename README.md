# PixelChat

Real-time 1:1 chat — friend requests, presence, typing indicators, and file
attachments. Built with Next.js (App Router) and Supabase.

## Stack

| Concern | Choice |
| --- | --- |
| App | Next.js 16 App Router, React 19, TypeScript, Tailwind v4, shadcn/ui |
| Auth | Supabase Auth via `@supabase/ssr` — httpOnly cookie sessions |
| Data | Supabase Postgres, access controlled entirely by Row Level Security |
| Real-time | Supabase Realtime — private Broadcast channels and Presence |
| Files | Supabase Storage, private bucket with signed URLs |
| Errors | Sentry (`@sentry/nextjs`) |
| Hosting | Vercel |

## How access control works

There is no API server. The browser talks to Postgres through PostgREST, and
every rule is enforced in the database, so a request that skips the UI is
subject to the same checks:

- **Membership** is the single predicate. `private.is_member(conversation_id)`
  answers only *"is the caller a member"*, so it cannot leak anything about
  anyone else, and every policy on messages, conversations, and members is built
  on it.
- **Sender identity is pinned.** The insert policy on `messages` requires
  `sender_id = auth.uid()`, so a message cannot be attributed to someone else.
- **Messages are immutable.** `authenticated` holds only `SELECT, INSERT` on
  `messages` — no update or delete privilege exists to abuse.
- **Realtime is authorized too.** Channels are opened with `private: true` and
  checked against RLS policies on `realtime.messages`, so joining
  `conversation:<id>` you are not a member of is refused at the socket.
- **Notifications cannot be forged.** Clients may read `user:<their own id>` but
  never write to it; only a definer-rights trigger publishes there.
- **Attachments are private.** Object paths are `<conversation_id>/<file>` and
  storage policies re-check membership when a signed URL is minted.
- **`anon` has no table privileges at all.** Signed out, nothing is readable.

`supabase/tests/rls_test.sql` asserts all of this. It seeds its own users, runs
the checks, and rolls back:

```bash
supabase db execute --file supabase/tests/rls_test.sql
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in from Supabase → Project Settings → API
npm run dev
```

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SENTRY_DSN=https://...ingest.de.sentry.io/...
```

Both Supabase values are meant to be public. The service role key is not used
anywhere in this project and must never be added to a `NEXT_PUBLIC_` variable.

Checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## Database changes

Migrations live in `supabase/migrations/` and are the source of truth.

```bash
supabase link --project-ref <project-ref>
supabase db push
```

After changing the schema, regenerate types and re-run the linter:

```bash
supabase gen types typescript --project-id <project-ref> > src/lib/supabase/database.types.ts
supabase db advisors
```

New tables need `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, policies, and an
explicit `GRANT` — Supabase no longer exposes new public tables to the Data API
automatically, and its default privileges hand `ALL` to `anon` and
`authenticated` until revoked (see
`supabase/migrations/20260825132353_tighten_table_privileges.sql`).

## Deployment

**Vercel** — import the repo and set, for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` — build-time only; without it stack traces stay minified

**Supabase** — under Authentication → URL Configuration add the production URL
as the Site URL and `https://<project>-*.vercel.app/**` as a redirect URL so
preview deployments can complete sign-in.

Email confirmation uses Supabase's built-in SMTP, which is rate limited to a
handful of messages per hour and is not suitable for production. Configure a
real SMTP provider before launch, or turn confirmation off deliberately.

## Project layout

```
src/
  app/
    auth/            server actions for sign in/up/out, and the callback route
    chat/            the authenticated chat page (server-rendered shell)
    login, signup    auth pages
  components/
    chat/            chat shell, thread, attachments, friends
    ui/              shadcn primitives
  lib/
    supabase/        browser and server client factories, generated types
    validation.ts    zod schemas shared by forms and actions
  proxy.ts           session refresh and route gating (Next 16 renamed
                     middleware.ts to proxy.ts)
supabase/
  migrations/        schema, RLS policies, triggers, functions
  tests/rls_test.sql security regression test
```
