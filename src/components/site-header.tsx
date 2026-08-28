import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SiteNavMenu } from '@/components/site-nav-menu'
import { NavLink } from '@/components/nav-link'
import { createClient } from '@/lib/supabase/server'

// Anchors on the landing page have to be absolute: from /about a bare
// "#features" would just scroll nowhere.
export const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About us' },
  { href: '/download', label: 'Download' },
  { href: '/faq', label: 'FAQ' },
] as const

export async function SiteHeader() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const signedIn = Boolean(data?.claims)

  // Signed out, "Chat" is the pitch for the product, so it lands on login.
  const links = [{ href: signedIn ? '/chat' : '/login', label: 'Chat' }, ...NAV_LINKS]

  return (
    <header className="sticky top-0 z-40 border-b-2 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
        <Link href="/" className="font-display text-lg tracking-tight">
          PixelChat
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm hover:text-link hover:underline"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <span className="ml-auto flex items-center gap-2 md:ml-0">
          <ThemeToggle />
          {/* Signed in, a Login button would only bounce off the proxy back to /chat. */}
          {signedIn ? (
            <Button asChild size="sm"><Link href="/chat">Open chat</Link></Button>
          ) : (
            <>
              <Button asChild size="sm" variant="secondary" className="hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm"><Link href="/signup">Sign Up</Link></Button>
            </>
          )}
          <SiteNavMenu links={links} />
        </span>
      </div>
    </header>
  )
}
