import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/chat')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">PixelChat</h1>
        <p className="text-muted-foreground">
          Fast, simple, and modern chat. Connect with friends, share files, and stay
          in sync in real time.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg"><Link href="/login">Login</Link></Button>
          <Button asChild size="lg" variant="secondary"><Link href="/signup">Sign Up</Link></Button>
        </div>
      </div>
    </main>
  )
}
