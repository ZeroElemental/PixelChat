import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Image as ImageIcon, MessageSquare, Palette, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Realtime',
    body: 'Messages, presence and typing indicators arrive over an authorized realtime channel -- no polling, no refresh.',
  },
  {
    icon: Users,
    title: 'Friends',
    body: 'Find people by username, send a request, and get a private conversation the moment they accept.',
  },
  {
    icon: ImageIcon,
    title: 'Attachments',
    body: 'Share images and files up to 10 MB. They live in a private bucket and are served over short-lived signed URLs.',
  },
  {
    icon: Palette,
    title: 'Two CRTs',
    body: 'Paper-and-ink by day, green phosphor by night. Pick one or follow your system.',
  },
] as const

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/chat')

  return (
    <>
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-2xl space-y-8 text-center">
          <span className="pixel-typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <h1 className="font-display text-3xl tracking-tight md:text-5xl">PixelChat</h1>
          <p className="mx-auto max-w-md text-muted-foreground">
            Fast, simple, and modern chat. Connect with friends, share files, and stay
            in sync in real time.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg"><Link href="/login">Login</Link></Button>
            <Button asChild size="lg" variant="secondary"><Link href="/signup">Sign Up</Link></Button>
          </div>
        </div>
      </section>

      {/* scroll-mt clears the sticky header, which would otherwise cover the
          heading when the nav anchor jumps here. */}
      <section id="features" className="scroll-mt-20 border-t-2 px-4 py-16">
        <div className="mx-auto max-w-5xl space-y-8">
          <h2 className="text-center font-display text-2xl">What you get</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="h-6 w-6 text-link" aria-hidden="true" />
                  <CardTitle className="font-display text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
