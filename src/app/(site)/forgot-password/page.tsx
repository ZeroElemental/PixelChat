import { PasswordForm } from '@/components/password-form'

export const metadata = { title: 'Reset password · PixelChat' }

export default function ForgotPasswordPage() {
  return <PasswordForm mode="request" />
}
