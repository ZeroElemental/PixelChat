'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  me: string
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAccountDialog({ me, username, open, onOpenChange }: Props) {
  const [typed, setTyped] = useState('')
  const [pending, setPending] = useState(false)

  async function destroy(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    const supabase = createClient()

    // Remove the avatar bytes first, while the session still exists. This has to
    // happen out here: Supabase's storage.protect_delete() trigger rejects any
    // direct delete from storage.objects, so the RPC cannot touch storage at all
    // -- only the Storage API can, and only where a policy allows it, which
    // avatars_delete_own does.
    const { data: files } = await supabase.storage.from('avatars').list(me)
    if (files?.length) {
      await supabase.storage.from('avatars').remove(files.map((f) => `${me}/${f.name}`))
    }

    const { error } = await supabase.rpc('delete_own_account')
    if (error) {
      setPending(false)
      toast.error('Could not delete the account')
      return
    }

    // The JWT stays cryptographically valid until it expires even though the row
    // behind it is gone, so the session has to be torn down explicitly. Reusing
    // the sign-out action rather than the browser client's: it also revalidates
    // the layout, and every cached server render is stale now.
    await signOut()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <form onSubmit={destroy}>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete your account</DialogTitle>
            <DialogDescription>This is immediate and cannot be undone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Your profile, every message you have sent, your conversations and
              your friendships are deleted permanently &mdash; including from the
              other person&apos;s side of the chat.
            </p>

            <div className="space-y-2">
              <Label htmlFor="confirm-username">
                Type <span className="font-mono text-foreground">{username}</span> to confirm
              </Label>
              <Input
                id="confirm-username"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                aria-label={`Type ${username} to confirm`}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={pending || typed !== username}>
              {pending ? 'Deleting…' : 'Delete account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
