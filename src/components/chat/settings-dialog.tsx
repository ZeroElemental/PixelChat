'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { LogOut, Trash2, UserPen } from 'lucide-react'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { motionOff, setMotionOff, setSoundOn, soundOn } from '@/lib/prefs'

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditProfile: () => void
  onDeleteAccount: () => void
}

export function SettingsDialog({
  open, onOpenChange, onEditProfile, onDeleteAccount,
}: Props) {
  const { theme, setTheme } = useTheme()

  // Both live in localStorage. AppMenu only mounts this once the user has opened
  // it, so these initializers never run on the server and there is nothing to
  // reconcile -- no mounted guard, no cascading render.
  const [reduceMotion, setReduceMotion] = useState(motionOff)
  const [sound, setSound] = useState(soundOn)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>These apply to this browser only.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Theme</legend>
            <div className="flex gap-2">
              {THEMES.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={theme === option.value ? 'default' : 'secondary'}
                  aria-pressed={theme === option.value}
                  onClick={() => setTheme(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-start gap-3 text-sm" htmlFor="reduce-motion">
            <input
              id="reduce-motion"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={reduceMotion}
              onChange={(e) => {
                setReduceMotion(e.target.checked)
                setMotionOff(e.target.checked)
              }}
            />
            <span>
              Reduce motion
              <span className="block text-muted-foreground">
                Stops the drifting backdrop and the pixels that fly off as you type.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm" htmlFor="sound">
            <input
              id="sound"
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 accent-primary"
              checked={sound}
              onChange={(e) => {
                setSound(e.target.checked)
                setSoundOn(e.target.checked)
              }}
            />
            <span>
              Sound on new message
              <span className="block text-muted-foreground">
                A short blip when someone else sends you something.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 pt-4">
            <Button type="button" variant="secondary" onClick={onEditProfile}>
              <UserPen className="h-4 w-4" />
              Edit profile
            </Button>
            <form action={signOut}>
              <Button type="submit" variant="secondary">
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </form>
          </div>

          {/* Destructive is reserved for the one thing here that cannot be
              undone, so logging out above uses the neutral variant. */}
          <div className="space-y-2 border-t-2 pt-4">
            <p className="text-sm font-medium text-destructive">Danger zone</p>
            <p className="text-sm text-muted-foreground">
              Deleting removes your profile, your messages and your conversations
              for good.
            </p>
            <Button type="button" variant="destructive" onClick={onDeleteAccount}>
              <Trash2 className="h-4 w-4" />
              Delete account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
