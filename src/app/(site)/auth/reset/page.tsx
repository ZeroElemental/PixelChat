import { PasswordForm } from '@/components/password-form'

export const metadata = { title: 'New password · PixelChat' }

// Reached only from the recovery link, which leaves a session behind -- so this
// route is PROTECTED in proxy.ts rather than an AUTH_PAGE, or the proxy would
// bounce the very user who needs it straight to /chat.
export default function ResetPasswordPage() {
  return <PasswordForm mode="update" />
}
