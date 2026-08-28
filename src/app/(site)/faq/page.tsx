import { FaqContent } from '@/components/content/faq'

export const metadata = { title: 'FAQ · PixelChat' }

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">FAQ</h1>
      <FaqContent />
    </section>
  )
}
