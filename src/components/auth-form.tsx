'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, signUp, type AuthState } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'

export function AuthForm({ mode, next }: { mode: 'signin' | 'signup'; next: string }) {
  const isSignUp = mode === 'signup'
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isSignUp ? signUp : signIn,
    {},
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Pick a username to get started' : 'Sign in to continue to PixelChat'}
          </CardDescription>
        </CardHeader>

        <form action={action}>
          <CardContent className="space-y-4">
            <input type="hidden" name="next" value={next} />

            {state.error && (
              <p role="alert" className="text-sm text-destructive">{state.error}</p>
            )}
            {state.notice && (
              <p role="status" className="text-sm text-muted-foreground">{state.notice}</p>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username" name="username" required autoComplete="username"
                  pattern="[A-Za-z0-9_]{3,24}" placeholder="pixelfan"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" name="email" type="email" required
                autoComplete="email" placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" name="password" type="password" required minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
            </div>
          </CardContent>

          <CardFooter className="mt-4 flex flex-col">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? 'Please wait…' : isSignUp ? 'Sign Up' : 'Login'}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Link
                href={isSignUp ? '/login' : '/signup'}
                className="text-primary hover:underline"
              >
                {isSignUp ? 'Login' : 'Sign Up'}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
