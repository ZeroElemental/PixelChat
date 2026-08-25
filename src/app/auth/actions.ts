'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { signInSchema, signUpSchema } from '@/lib/validation'

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
  redirect(String(formData.get('next') || '/chat'))
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

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
