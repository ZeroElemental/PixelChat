export const metadata = { title: 'FAQ · PixelChat' }

const QUESTIONS = [
  {
    q: 'Is PixelChat free?',
    a: 'Yes. It is a personal project with no paid tier, no ads and nothing to upsell.',
  },
  {
    q: 'How do I add someone?',
    a: 'Open the chat, use the add-friend button in the sidebar and enter their exact username. They get a request they can accept or decline; a conversation appears for both of you the moment they accept.',
  },
  {
    q: 'Can I change my username later?',
    a: 'Yes. Click your avatar in the chat sidebar to edit your username and photo. Usernames are unique, so a name someone else already holds will be refused.',
  },
  {
    q: 'What can I send?',
    a: 'Text, images and files up to 10 MB each. Attachments go to a private bucket and are fetched with short-lived signed URLs, so a raw link will not work for anyone else.',
  },
  {
    q: 'Are my messages encrypted end to end?',
    a: 'No. Traffic is encrypted in transit and rows are locked down with row-level security, but the database can read message contents. Do not use PixelChat for anything that needs end-to-end secrecy.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Not yet -- see the Download page. The web app is responsive and works on a phone today.',
  },
  {
    q: 'How do I switch to dark mode?',
    a: 'Signed out, use the sun/moon button in the header. Signed in, open the three-dots menu in the chat sidebar and choose Settings.',
  },
] as const

export default function FaqPage() {
  return (
    <section className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">FAQ</h1>

      {/* Native disclosure, so no accordion library and no client component. */}
      <div className="space-y-3">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="group border-2 bg-card shadow-pixel-sm">
            <summary className="list-none px-4 py-3 font-medium marker:content-none">
              <span className="mr-2 font-mono text-link" aria-hidden="true">
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">-</span>
              </span>
              {item.q}
            </summary>
            <p className="border-t-2 px-4 py-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
