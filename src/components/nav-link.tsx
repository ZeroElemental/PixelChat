import Link from 'next/link'

/**
 * A nav item, rendered as a plain anchor when it carries a hash.
 *
 * App Router client navigation puts the hash in the URL but does not scroll to
 * it when the route changes as well, so /about -> /#features lands at the top of
 * the page. A plain anchor is right in both directions: a document load when the
 * route differs, and the browser's own in-page jump when it does not.
 *
 * Its own file because both the server-rendered header and the client-rendered
 * mobile menu use it.
 */
export function NavLink({
  href, className, onClick, children,
}: {
  href: string
  className?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  if (href.includes('#')) {
    return <a href={href} className={className} onClick={onClick}>{children}</a>
  }
  return <Link href={href} className={className} onClick={onClick}>{children}</Link>
}
