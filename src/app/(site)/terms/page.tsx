export const metadata = { title: 'Terms · PixelChat' }

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-2xl space-y-6 px-4 py-16">
      <h1 className="font-display text-2xl md:text-3xl">Terms</h1>
      <p className="text-sm text-muted-foreground">
        A plain-English summary of the deal. It is not legal advice and it is not a
        contract.
      </p>

      <h2 className="font-display text-lg">The service</h2>
      <p className="text-muted-foreground">
        PixelChat is a free personal project offered as-is. There is no uptime
        promise, no support commitment, and features may change or disappear. Keep
        your own copy of anything you would be sorry to lose.
      </p>

      <h2 className="font-display text-lg">Your account</h2>
      <p className="text-muted-foreground">
        One person per account. You are responsible for what is sent from it, so
        keep your password to yourself. Pick a username that is not someone else{'\u2019'}s
        name or trademark.
      </p>

      <h2 className="font-display text-lg">What not to send</h2>
      <p className="text-muted-foreground">
        No harassment, no illegal material, no malware, and nothing you do not have
        the right to share. Accounts that do are removed without notice.
      </p>

      <h2 className="font-display text-lg">Ending it</h2>
      <p className="text-muted-foreground">
        You can stop using PixelChat at any time and ask for your account to be
        deleted. The same right runs the other way: the service can be shut down or
        an account closed, for abuse or simply because the project ends.
      </p>
    </article>
  )
}
