import Link from 'next/link'
import { SiteNav } from '@/components/site-nav'
import { createClient } from '@/lib/supabase/server'

export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return (
    <header className="sticky top-0 z-40 border-b-2 pt-[env(safe-area-inset-top)] bg-background/95 backdrop-blur">
      <div className="site-container flex h-14 items-center gap-4 gutter">
        <Link href="/" className="font-display text-lg tracking-tight">
          PixelChat
        </Link>
        <SiteNav signedIn={Boolean(data?.claims)} />
      </div>
    </header>
  )
}
