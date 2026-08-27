import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PixelBackdrop } from '@/components/pixel-backdrop'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/chat')

  return (
    // No bg-* here: the body background plus the backdrop show through.
    <main className="flex min-h-screen items-center justify-center p-6 text-foreground">
      <PixelBackdrop />
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
    </main>
  )
}
