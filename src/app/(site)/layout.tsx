import { PixelBackdrop } from '@/components/pixel-backdrop'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

/* Everything outside /chat. The backdrop lives here rather than per page so no
   route paints two copies of it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col text-foreground">
      <PixelBackdrop />
      <SiteHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <SiteFooter />
    </div>
  )
}
