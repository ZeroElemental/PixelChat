'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NavLink } from '@/components/nav-link'
import { ThemeToggle } from '@/components/theme-toggle'
import { ContentDialog } from '@/components/content-dialog'
import { AboutContent } from '@/components/content/about'
import { FaqContent } from '@/components/content/faq'

/**
 * Everything in the header to the right of the wordmark, at both breakpoints,
 * plus the About and FAQ dialogs.
 *
 * One component because the desktop row and the mobile popover render the same
 * list, and the two dialogs have to be siblings of both -- a dialog rendered
 * inside PopoverContent would unmount with the popover before it could open.
 * SiteHeader stays a server component and just hands down `signedIn`.
 */

// Anchors on the landing page have to be absolute: from /about a bare
// "#features" would just scroll nowhere.
// `panel` marks the entries that open in place instead of navigating.
const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/about', label: 'About us', panel: 'about' },
  { href: '/download', label: 'Download' },
  { href: '/faq', label: 'FAQ', panel: 'faq' },
] as const

type Panel = 'about' | 'faq' | null

export function SiteNav({ signedIn }: { signedIn: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)

  // Signed out, "Chat" is the pitch for the product, so it lands on login.
  const links = [
    { href: signedIn ? '/chat' : '/login', label: 'Chat', panel: undefined },
    ...NAV_LINKS,
  ]

  function item(
    link: { href: string; label: string; panel?: string },
    className: string,
  ) {
    if (link.panel) {
      return (
        <button
          key={link.href}
          type="button"
          className={className}
          onClick={() => {
            setMenuOpen(false)
            setPanel(link.panel as Panel)
          }}
        >
          {link.label}
        </button>
      )
    }
    return (
      <NavLink
        key={link.href}
        href={link.href}
        onClick={() => setMenuOpen(false)}
        className={className}
      >
        {link.label}
      </NavLink>
    )
  }

  return (
    <>
      <nav className="ml-auto hidden items-center gap-1 md:flex">
        {links.map((link) => item(link, 'px-3 py-2 text-sm hover:text-link hover:underline'))}
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

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {links.map((link) =>
              item(link, 'block w-full px-3 py-2 text-left text-sm hover:bg-muted'),
            )}
          </PopoverContent>
        </Popover>
      </span>

      <ContentDialog
        open={panel === 'about'}
        onOpenChange={(next) => !next && setPanel(null)}
        title="About us"
      >
        <AboutContent />
      </ContentDialog>

      <ContentDialog
        open={panel === 'faq'}
        onOpenChange={(next) => !next && setPanel(null)}
        title="FAQ"
      >
        <FaqContent />
      </ContentDialog>
    </>
  )
}
