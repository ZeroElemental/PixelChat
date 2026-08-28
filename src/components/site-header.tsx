import Link from 'next/link'
import { SiteNav } from '@/components/site-nav'
import { createClient } from '@/lib/supabase/server'

export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  return (
    <header className="sticky top-0 z-40 border-b-2 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="font-display text-lg tracking-tight">
          PixelChat
        </Link>
        <SiteNav signedIn={Boolean(data?.claims)} />
      </div>
    </header>
  )
}
