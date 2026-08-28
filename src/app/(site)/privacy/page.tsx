export const metadata = { title: 'Privacy · PixelChat' }

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">Privacy</h1>
      <p className="text-sm text-muted-foreground">
        A plain-English summary of what PixelChat stores and why. It is not legal
        advice and it is not a contract.
      </p>

      <h2 className="font-display text-lg">What is stored</h2>
      <ul className="list-inside list-disc space-y-1 text-muted-foreground">
        <li>Your email address and password hash, held by Supabase Auth.</li>
        <li>Your username and avatar image. Avatars are in a public bucket, so the image URL is guessable by design.</li>
        <li>Your messages, their timestamps, and who they were sent to.</li>
        <li>File attachments, in a private bucket reachable only through signed URLs.</li>
        <li>Friend requests and friendships.</li>
      </ul>

      <h2 className="font-display text-lg">Who can see it</h2>
      <p className="text-muted-foreground">
        Row-level security limits every read to rows you are a party to: you cannot
        query a conversation you are not a member of, and realtime channels are
        authorized the same way. Message contents are not end-to-end encrypted, so
        whoever operates the database can technically read them.
      </p>

      <h2 className="font-display text-lg">Third parties</h2>
      <p className="text-muted-foreground">
        Supabase hosts the database, auth and file storage. Sentry receives crash
        and error reports, which can include the page you were on and a stack
        trace. There is no advertising, no analytics profile and nothing is sold.
      </p>

      <h2 className="font-display text-lg">Deleting your data</h2>
      <p className="text-muted-foreground">
        Ask, and the account plus everything attached to it is removed. Copies
        already delivered to the people you chatted with stay with them.
      </p>
    </article>
  )
}
