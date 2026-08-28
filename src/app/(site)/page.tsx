import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChatDemo } from '@/components/chat-demo'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

const SPEC = [
  ['Protocol', 'Supabase Realtime. One authorized channel per conversation, joined with your own token.'],
  ['Presence', 'Online and typing states ride the same socket as the messages. Nothing polls.'],
  ['Attachments', 'Images and files up to 10 MB, in a private bucket, handed out as short-lived signed URLs.'],
  ['Accounts', 'Email and password. Unique usernames, an editable profile, an avatar you can replace.'],
  ['Themes', 'Paper and ink, or green phosphor. Follows your system unless you tell it otherwise.'],
  ['Security', 'Row-level security on every table. Authorization decided from a locally verified token.'],
] as const

const LIMITS = [
  'Not end-to-end encrypted. Traffic is encrypted in transit, but the server can read message contents.',
  'No group chats. One conversation, two people, for now.',
  'No desktop or mobile build. It runs in a browser and installs to a home screen.',
] as const

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/chat')

  return (
    <>
      {/* Same section > centred max-w-5xl nesting as the two below, so every
          left edge on the page lines up. */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="font-display text-3xl tracking-tight md:text-5xl">PixelChat</h1>
            <p className="text-xl">Two people, one green screen.</p>
            <p className="max-w-md text-muted-foreground">
              Direct messages between friends. No threads, no channels, no bots.
              Messages, presence and typing arrive over a realtime socket rather
              than a poll loop, so the other side is where you left it.
            </p>
            <div className="flex items-center gap-4">
              <Button asChild size="lg"><Link href="/signup">Sign Up</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link href="/login">Login</Link></Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Free. Runs in a browser. No card, no trial.
            </p>
          </div>

          <ChatDemo />
        </div>
      </section>

      {/* The header's Features link points here, so the id has to live on this
          section. scroll-mt clears the sticky header on the jump. */}
      <section id="features" className="scroll-mt-20 border-t-2 px-4 py-16">
        {/* max-w-5xl, like the hero, so every section shares one left edge. */}
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 font-display text-xl">Specifications</h2>
          <dl>
            {SPEC.map(([term, detail]) => (
              <div key={term} className="grid gap-1 border-t-2 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                <dt className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {term}
                </dt>
                <dd className="max-w-2xl text-sm">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t-2 px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-6">
          <h2 className="font-display text-xl">What it isn&apos;t</h2>
          <ul className="space-y-3">
            {LIMITS.map((limit) => (
              <li key={limit} className="flex max-w-2xl gap-3 text-sm text-muted-foreground">
                <span aria-hidden="true" className="text-link">&mdash;</span>
                {limit}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
