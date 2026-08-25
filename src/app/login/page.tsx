import { Suspense } from 'react'
import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Login · PixelChat' }

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="signin" />
    </Suspense>
  )
}
