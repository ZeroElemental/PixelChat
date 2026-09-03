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
- **Avatars are public, deliberately.** `profiles` is readable by every signed-in
  user, so an `avatar_url` is already visible to anyone who could see the image.
  A public bucket buys stable, cacheable URLs instead of signing one per render;
  writes are still restricted to `<your own id>/<file>`.
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

Email confirmation is turned **off** deliberately, under Authentication →
Providers → Email. Supabase's built-in SMTP is rate limited to a handful of
messages per hour, so leaving confirmation on would silently break signups once
more than a few people tried in the same hour. `signUp` already handles both
paths (`src/app/auth/actions.ts`), so re-enabling it only requires configuring a
real SMTP provider first — nothing in the app needs to change.

## Project layout

```
src/
  app/
    (site)/            public pages -- landing, auth, about, FAQ, legal
    auth/              server actions for sign in/up/out, and the callback route
    chat/              the authenticated chat page (server-rendered shell)
  components/
    chat/
      chat-shell.tsx   owns chat state and wires the pieces together
      use-realtime.ts  channel subscriptions, presence and typing
      conversation-list.tsx, message-thread.tsx, attachment.tsx
      friends.tsx, profile-dialog.tsx, settings-dialog.tsx, app-menu.tsx
    content/           page copy shared between routes and in-place dialogs
    user-avatar.tsx    avatar with initial fallback, used everywhere
    site-*.tsx         header, nav and footer for the public pages
    ui/                shadcn primitives -- regenerated, do not hand-edit
  lib/
    supabase/          browser and server client factories, generated types
    queries.ts         reads shared by server and browser callers
    validation.ts      zod schemas, input rules and limits
    prefs.ts           client-side preferences (sound, motion)
  proxy.ts             session refresh and route gating (Next 16 renamed
                       middleware.ts to proxy.ts)
supabase/
  migrations/          schema, RLS policies, triggers, functions, storage buckets
  tests/rls_test.sql   security regression test
```

A few conventions worth knowing before adding to this:

- **Rules live in `lib/validation.ts`**, once. `USERNAME_PATTERN` feeds both the
  zod schema and the HTML `pattern` attributes; `checkFile` and the `*_RULE`
  objects hold the upload limits. The database enforces all of it again anyway --
  these exist to fail early with a better message, not to be the only check.
- **Queries used from both sides go in `lib/queries.ts`** and take a client as
  an argument, so the same read works server-side and in the browser.
- **`components/ui/` is generated.** Edits there are lost the next time a
  primitive is re-added; put shared presentation one level up instead.
