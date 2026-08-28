import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'Download · PixelChat' }

export default async function DownloadPage() {
  // No redirect here: this page has to stay reachable from the in-app menu.
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  return (
    <section className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-6 text-center">
        <span className="pixel-typing" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <h1 className="font-display text-2xl md:text-3xl">Download</h1>
        <p className="text-muted-foreground">
          Nothing to download yet. Desktop and mobile builds are in the works.
        </p>
        <p className="text-sm text-muted-foreground">
          Until then PixelChat runs in any modern browser, and it installs to your
          home screen like an app if you want it there.
        </p>
        <Button asChild size="lg">
          <Link href={signedIn ? '/chat' : '/login'}>
            {signedIn ? 'Open the web app' : 'Use the web app'}
          </Link>
        </Button>
      </div>
    </section>
  )
}
