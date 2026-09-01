'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AVATAR_MAX_BYTES, AVATAR_MIME, USERNAME_PATTERN, usernameSchema,
} from '@/lib/validation'

type Props = {
  me: string
  username: string
  avatarUrl: string | null
  onSaved: (next: { username: string; avatarUrl: string | null }) => void
  /* Set by ChatShell so Settings can open this dialog too. The trigger below
     still works on its own when these are omitted. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProfileDialog({
  me, username, avatarUrl, onSaved, open: openProp, onOpenChange,
}: Props) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChange ?? setOpenState

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex min-w-0 items-center gap-2 rounded-md p-1 hover:bg-muted/50"
          aria-label="Edit your profile"
        >
          <UserAvatar
            className="h-7 w-7 shrink-0"
            fallbackClassName="text-xs"
            name={username}
            avatarUrl={avatarUrl}
          />
          <span className="truncate font-semibold">{username}</span>
        </button>
      </DialogTrigger>

      <DialogContent>
        {/* The draft lives in here, not in ProfileDialog: Radix unmounts a closed
            DialogContent, so every open starts from what is actually stored and
            a stale draft from a previous cancel cannot survive. Nothing to
            synchronize, and it works however the dialog was opened. */}
        <ProfileForm
          me={me}
          username={username}
          avatarUrl={avatarUrl}
          onSaved={onSaved}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function ProfileForm({
  me, username, avatarUrl, onSaved, onDone,
}: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const [draftName, setDraftName] = useState(username)
  const [preview, setPreview] = useState(avatarUrl)
  const [pending, setPending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadAvatar(file: File) {
    // The bucket enforces both of these too; checking here just avoids a
    // pointless upload and gives a better message.
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Avatars must be 2 MB or smaller')
      return
    }
    if (!(AVATAR_MIME as readonly string[]).includes(file.type)) {
      toast.error('Use a PNG, JPEG or WebP image')
      return
    }

    setPending(true)
    const supabase = createClient()
    // One fixed object per user, overwritten in place. Storage policies check the
    // first path segment against auth.uid(). A unique path per upload would leave
    // the previous avatar orphaned in the bucket on every change; the extension is
    // omitted because Storage serves the content type it was uploaded with.
    const path = `${me}/avatar`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, file, { contentType: file.type, upsert: true })
    setPending(false)

    if (error) {
      toast.error('Upload failed')
      return
    }
    // Public bucket, so the URL is stable and needs no re-signing -- which is
    // exactly why it needs a cache buster once the path stops changing.
    const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(path).data
    setPreview(`${publicUrl}?v=${Date.now()}`)
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    const name = draftName.trim()

    const parsed = usernameSchema.safeParse(name)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return
    }

    setPending(true)
    const supabase = createClient()

    // A case-only rename collides with the caller's own row under the
    // lower(username) unique index, so username_available would wrongly say no.
    // The update itself is fine -- a row never conflicts with itself.
    if (parsed.data.toLowerCase() !== username.toLowerCase()) {
      const { data: available } = await supabase.rpc('username_available', {
        candidate: parsed.data,
      })
      if (!available) {
        setPending(false)
        toast.error('That username is taken')
        return
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: parsed.data, avatar_url: preview })
      .eq('id', me)
    setPending(false)

    if (error) {
      toast.error(error.code === '23505' ? 'That username is taken' : 'Could not save')
      return
    }

    onSaved({ username: parsed.data, avatarUrl: preview })
    toast.success('Profile updated')
    onDone()
  }

  return (
    <form onSubmit={save}>
      <DialogHeader>
        <DialogTitle>Your profile</DialogTitle>
        <DialogDescription>
          Your username is how friends find you.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            className="h-16 w-16"
            fallbackClassName="text-xl"
            name={draftName || username}
            avatarUrl={preview}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={AVATAR_MIME.join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void uploadAvatar(file)
            }}
          />
          <span className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              Change photo
            </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setPreview(null)}
              >
                Remove
              </Button>
            )}
          </span>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-username">Username</Label>
          <Input
            id="profile-username"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            pattern={USERNAME_PATTERN}
            required
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={pending || !draftName.trim()}>
          {pending ? 'Saving…' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  )
}
