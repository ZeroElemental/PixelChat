import { z } from 'zod'

// bcrypt silently truncates past 72 bytes, so cap rather than let it happen.
const password = z.string().min(8, 'At least 8 characters').max(72)

// One rule, three consumers: the zod schema below, the HTML `pattern` attribute
// on every username input, and the database check constraint (see
// supabase/migrations/*_core_schema.sql). Keep those three in step.
export const USERNAME_PATTERN = '[A-Za-z0-9_]{3,24}'

export const usernameSchema = z
  .string()
  .regex(new RegExp(`^${USERNAME_PATTERN}$`), '3-24 letters, numbers or underscores')

export const signInSchema = z.object({
  email: z.email('Enter a valid email'),
  password,
})

export const signUpSchema = signInSchema.extend({ username: usernameSchema })

// Reset asks for the address alone; the new-password form asks for the password
// alone. Both reuse the pieces above rather than restating the rules.
export const resetRequestSchema = signInSchema.pick({ email: true })
export const newPasswordSchema = z.object({ password })

export const messageSchema = z.object({
  conversationId: z.uuid(),
  body: z.string().trim().min(1, 'Message is empty').max(4000),
})

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024

// One entry per item in the composer's attach menu; each group's `mime` is what the
// file dialog is narrowed to. Flattened, this is exactly the bucket allowlist in
// supabase/migrations/*_storage_attachments.sql - keep the two in step.
export const ATTACHMENT_GROUPS = [
  { label: 'Photo', mime: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] },
  { label: 'Document', mime: ['application/pdf', 'text/plain'] },
  { label: 'Archive', mime: ['application/zip'] },
] as const

export const ATTACHMENT_MIME = ATTACHMENT_GROUPS.flatMap((group) => group.mime)

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const

export type FileRule = {
  maxBytes: number
  mime: readonly string[]
  tooBig: string
  wrongType: string
}

export const ATTACHMENT_RULE: FileRule = {
  maxBytes: ATTACHMENT_MAX_BYTES,
  mime: ATTACHMENT_MIME,
  tooBig: 'Files must be 10 MB or smaller',
  wrongType: 'That file type is not allowed',
}

export const AVATAR_RULE: FileRule = {
  maxBytes: AVATAR_MAX_BYTES,
  mime: AVATAR_MIME,
  tooBig: 'Avatars must be 2 MB or smaller',
  wrongType: 'Use a PNG, JPEG or WebP image',
}

/**
 * Returns the message to show, or null when the file is acceptable.
 *
 * The buckets enforce both limits too; checking here just avoids a pointless
 * upload and gives a better message.
 */
export function checkFile(file: { size: number; type: string }, rule: FileRule): string | null {
  if (file.size > rule.maxBytes) return rule.tooBig
  if (!rule.mime.includes(file.type)) return rule.wrongType
  return null
}

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
