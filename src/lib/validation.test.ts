import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ATTACHMENT_RULE, AVATAR_RULE, checkFile,
  newPasswordSchema, resetRequestSchema, safeRedirectPath, signUpSchema, usernameSchema,
} from './validation.ts'

const BACKSLASH = String.fromCharCode(92)

test('safeRedirectPath keeps same-origin paths', () => {
  assert.equal(safeRedirectPath('/chat'), '/chat')
  assert.equal(safeRedirectPath('/chat?tab=1'), '/chat?tab=1')
  assert.equal(safeRedirectPath('/evil.com'), '/evil.com') // a path, not a host
})

test('safeRedirectPath refuses anything that leaves the origin', () => {
  for (const hostile of [
    'https://evil.com',
    '//evil.com',
    '/' + BACKSLASH + 'evil.com', // browsers read this as scheme-relative
    '//' + BACKSLASH + 'evil.com',
    'javascript:alert(1)',
    'chat',
    '',
    undefined,
    null,
    42,
  ]) {
    assert.equal(safeRedirectPath(hostile), '/chat', `allowed ${String(hostile)}`)
  }
})

test('safeRedirectPath honours an explicit fallback', () => {
  assert.equal(safeRedirectPath('https://evil.com', '/login'), '/login')
})

test('the reset schemas inherit the sign-in rules they were derived from', () => {
  assert.equal(resetRequestSchema.safeParse({ email: 'you@example.com' }).success, true)
  assert.equal(resetRequestSchema.safeParse({ email: 'not-an-email' }).success, false)
  // Derived with .pick(), so a password must not be required -- or the
  // forgot-password form could never submit.
  assert.equal(resetRequestSchema.safeParse({ email: 'you@example.com' }).success, true)

  assert.equal(newPasswordSchema.safeParse({ password: 'a'.repeat(8) }).success, true)
  assert.equal(newPasswordSchema.safeParse({ password: 'short' }).success, false)
  // bcrypt truncates silently past 72 bytes; the cap has to survive the reuse.
  assert.equal(newPasswordSchema.safeParse({ password: 'a'.repeat(73) }).success, false)
})

test('usernames match what the database check constraint allows', () => {
  for (const ok of ['abc', 'pixel_fan', 'A1_23456789012345678901']) {
    assert.equal(usernameSchema.safeParse(ok).success, true, `rejected ${ok}`)
  }
  for (const bad of ['ab', 'a'.repeat(25), 'has space', 'has-dash', 'emoji😀', '']) {
    assert.equal(usernameSchema.safeParse(bad).success, false, `accepted ${bad}`)
  }
})

test('signup requires a valid email and an 8-72 character password', () => {
  const base = { email: 'a@b.com', username: 'valid_name' }
  assert.equal(signUpSchema.safeParse({ ...base, password: 'x'.repeat(8) }).success, true)
  assert.equal(signUpSchema.safeParse({ ...base, password: 'x'.repeat(7) }).success, false)
  // bcrypt truncates past 72 bytes, so anything longer must be rejected outright
  assert.equal(signUpSchema.safeParse({ ...base, password: 'x'.repeat(73) }).success, false)
  assert.equal(signUpSchema.safeParse({ ...base, email: 'nope', password: 'x'.repeat(8) }).success, false)
})

test('checkFile accepts allowed files and names what is wrong with the rest', () => {
  const png = { size: 1024, type: 'image/png' }
  assert.equal(checkFile(png, AVATAR_RULE), null)
  assert.equal(checkFile(png, ATTACHMENT_RULE), null)

  // Size is checked before type, so an oversized file reports its size.
  assert.equal(
    checkFile({ size: AVATAR_RULE.maxBytes + 1, type: 'image/png' }, AVATAR_RULE),
    AVATAR_RULE.tooBig,
  )
  assert.equal(
    checkFile({ size: 1024, type: 'image/gif' }, AVATAR_RULE),
    AVATAR_RULE.wrongType,
  )
  // Exactly at the limit is still allowed.
  assert.equal(checkFile({ size: AVATAR_RULE.maxBytes, type: 'image/png' }, AVATAR_RULE), null)

  // A GIF is fine as an attachment but not as an avatar -- the rules differ.
  assert.equal(checkFile({ size: 1024, type: 'image/gif' }, ATTACHMENT_RULE), null)
  assert.equal(
    checkFile({ size: 1024, type: 'application/x-msdownload' }, ATTACHMENT_RULE),
    ATTACHMENT_RULE.wrongType,
  )
})
