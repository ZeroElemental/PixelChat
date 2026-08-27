'use client'

import { useState } from 'react'
import { Bell, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FriendRequest } from '@/lib/types'

export function AddFriendDialog({ onAdd }: { onAdd: (username: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setPending(true)
    const ok = await onAdd(username.trim())
    setPending(false)
    if (ok) {
      setUsername('')
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Add a friend">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a friend</DialogTitle>
            <DialogDescription>
              They will get a request they can accept or decline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="friend-username">Username</Label>
            <Input
              id="friend-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              pattern="[A-Za-z0-9_]{3,24}"
              placeholder="pixelfan"
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !username.trim()}>
              {pending ? 'Sending…' : 'Send request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FriendRequests({
  requests, onAccept, onReject,
}: {
  requests: FriendRequest[]
  onAccept: (requesterId: string) => void
  onReject: (requesterId: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Friend requests (${requests.length})`}
        >
          <Bell className="h-4 w-4" />
          {requests.length > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 bg-destructive" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-2 text-sm font-medium">Friend requests</p>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing pending.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li key={request.requester_id} className="flex items-center justify-between gap-2">
                <span className="truncate text-sm">{request.username}</span>
                <span className="flex gap-1">
                  <Button size="sm" onClick={() => onAccept(request.requester_id)}>
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onReject(request.requester_id)}
                  >
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
