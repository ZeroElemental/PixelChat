import Link from 'next/link'

const LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/faq', label: 'FAQ' },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t-2">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-6 text-sm sm:flex-row sm:justify-between">
        <p className="text-muted-foreground">
          <span className="font-display">PixelChat</span>
          {` \u00a9 ${new Date().getFullYear()}`}
        </p>
        <nav className="flex items-center gap-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-link hover:underline">
              {link.label}
            </Link>
          ))}
          <a
            href="https://github.com/ZeroElemental/PixelChat"
            target="_blank"
            rel="noreferrer"
            className="hover:text-link hover:underline"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  )
}
