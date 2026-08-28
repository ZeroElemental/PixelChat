'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { requestPasswordReset, updatePassword, type AuthState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'

/**
 * Both halves of the reset flow: ask for a link, then set the new password.
 * Same Card + useActionState shape as AuthForm, kept separate because that
 * component's two modes are already carrying enough.
 */
export function PasswordForm({ mode }: { mode: 'request' | 'update' }) {
  const isRequest = mode === 'request'
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isRequest ? requestPasswordReset : updatePassword,
    {},
  )

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-xl">
            {isRequest ? 'Reset your password' : 'Choose a new password'}
          </CardTitle>
          <CardDescription>
            {isRequest
              ? 'We will email you a link to set a new one.'
              : 'Pick something you have not used here before.'}
          </CardDescription>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4">
            {state.error && (
              <p role="alert" className="text-sm text-destructive">{state.error}</p>
            )}
            {state.notice && (
              <p role="status" className="text-sm text-muted-foreground">{state.notice}</p>
            )}

            {isRequest ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" name="email" type="email" required
                  autoComplete="email" placeholder="you@example.com"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password" name="password" type="password" required minLength={8}
                  autoComplete="new-password" placeholder="••••••••"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="mt-4 flex flex-col">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Please wait…' : isRequest ? 'Send reset link' : 'Save password'}
            </Button>
            {isRequest && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link href="/login" className="text-link hover:underline">Login</Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
