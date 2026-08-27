import { z } from 'zod'

// bcrypt silently truncates past 72 bytes, so cap rather than let it happen.
const password = z.string().min(8, 'At least 8 characters').max(72)

export const signInSchema = z.object({
  email: z.email('Enter a valid email'),
  password,
})

export const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .regex(/^[A-Za-z0-9_]{3,24}$/, '3-24 letters, numbers or underscores'),
})

export const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1, 'Message is empty').max(4000),
})

export const usernameSchema = z
  .string()
  .regex(/^[A-Za-z0-9_]{3,24}$/, '3-24 letters, numbers or underscores')

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_MIME = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
] as const

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

/**
 * `next` arrives from the query string, so it must never be trusted as a
 * redirect target: an absolute URL there is an open redirect off the site.
 * Only same-origin absolute paths are allowed through.
 */
export function safeRedirectPath(value: unknown, fallback = '/chat'): string {
  if (typeof value !== 'string') return fallback
  // Browsers treat both '//evil.com' and '/\evil.com' as scheme-relative URLs,
  // so a leading slash alone is not enough to prove the target is same-origin.
  if (!/^\/(?![/\\])/.test(value)) return fallback
  return value
}
