import { FaqContent } from '@/components/content/faq'

export const metadata = { title: 'FAQ · PixelChat' }

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 gutter section-y">
      <h1 className="font-display text-2xl md:text-3xl">FAQ</h1>
      <FaqContent />
    </section>
  )
}
