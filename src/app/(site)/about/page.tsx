import { AboutContent } from '@/components/content/about'

export const metadata = { title: 'About · PixelChat' }

// The header and the chat menu open this as a dialog instead of navigating; the
// route stays for direct links, bookmarks and anyone arriving from outside.
export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">About us</h1>
      <AboutContent />
    </article>
  )
}
