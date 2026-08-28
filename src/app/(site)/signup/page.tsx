import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Sign up · PixelChat' }

export default function SignUpPage() {
  return <AuthForm mode="signup" next="/chat" />
}
