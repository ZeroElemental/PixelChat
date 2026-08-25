import { AuthForm } from '@/components/auth-form'
import { safeRedirectPath } from '@/lib/validation'

export const metadata = { title: 'Login · PixelChat' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  return <AuthForm mode="signin" next={safeRedirectPath(next)} />
}
