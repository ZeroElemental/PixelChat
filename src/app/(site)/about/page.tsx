export const metadata = { title: 'About · PixelChat' }

export default function AboutPage() {
  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">About us</h1>

      <p className="text-muted-foreground">
        PixelChat is a small, fast, one-to-one chat app dressed as a machine from
        thirty years ago. Square corners, offset shadows with no blur, a bitmap
        face for the headings, and a colour scheme that is either paper and ink or
        green phosphor on a dark CRT. None of that is skin-deep -- the whole
        interface is built on those rules.
      </p>

      <h2 className="font-display text-lg">How it works</h2>
      <p className="text-muted-foreground">
        The app is Next.js on the front and Supabase underneath. Messages, presence
        and typing indicators travel over authorized realtime channels, one per
        conversation, so a client only ever receives what it is allowed to see.
        Every table is behind row-level security, and authorization decisions are
        made from a locally verified JWT rather than a trusted-by-default session.
      </p>
      <p className="text-muted-foreground">
        Avatars sit in a public bucket; message attachments sit in a private one
        and are handed out as short-lived signed URLs.
      </p>

      <h2 className="font-display text-lg">Who makes it</h2>
      <p className="text-muted-foreground">
        This is a personal project, not a company. It is built in the open, it has
        no users to sell, and it is free. If something is broken or missing, the
        repository is the place to say so.
      </p>
    </article>
  )
}
