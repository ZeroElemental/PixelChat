'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  newPasswordSchema, resetRequestSchema, safeRedirectPath, signInSchema, signUpSchema,
} from '@/lib/validation'

export type AuthState = { error?: string; notice?: string }

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Invalid email or password' }

  revalidatePath('/', 'layout')
  redirect(safeRedirectPath(formData.get('next')))
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    username: formData.get('username'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { email, password, username } = parsed.data

  const supabase = await createClient()

  const { data: available } = await supabase.rpc('username_available', { candidate: username })
  if (!available) return { error: 'That username is taken' }

  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username }, emailRedirectTo: `${origin}/auth/callback` },
  })
  if (error) return { error: error.message }

  // No session means the project requires email confirmation first.
  if (!data.session) return { notice: `Check ${email} for a confirmation link.` }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

/**
 * Send a recovery link. The reply is the same whether or not the address has an
 * account -- `signIn` already flattens its error for the same reason, and a
 * "no such user" here would turn this form into an account-existence oracle.
 *
 * The link lands on /auth/callback, which exchanges the code and forwards to
 * /auth/reset. @supabase/ssr uses PKCE, so the code verifier lives in a cookie:
 * the link has to be opened in the browser that asked for it. signUp's
 * confirmation link already behaves this way.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  })

  return { notice: `If ${parsed.data.email} has an account, a reset link is on its way.` }
}

/** Runs with the session the recovery link established. */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({ password: formData.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  // Chiefly an expired or already-used link, which leaves no session to update.
  if (error) return { error: 'That reset link has expired. Request a new one.' }

  revalidatePath('/', 'layout')
  redirect('/chat')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
