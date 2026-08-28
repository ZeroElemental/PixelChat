'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Info, MoreVertical, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ContentDialog } from '@/components/content-dialog'
import { AboutContent } from '@/components/content/about'
import { SettingsDialog } from './settings-dialog'
import { DeleteAccountDialog } from './delete-account-dialog'

const ITEM = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'

/* The signed-in counterpart of SiteHeader's nav. Every dialog here is a sibling
   of the Popover driven by state: one nested inside PopoverContent would unmount
   with the popover before it could open.
   About opens in place rather than navigating, so reading it does not take you
   out of the conversation you were in. */
export function AppMenu({
  me, username, onEditProfile,
}: {
  me: string
  username: string
  onEditProfile: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          <button
            type="button"
            className={ITEM}
            onClick={() => {
              setMenuOpen(false)
              setAboutOpen(true)
            }}
          >
            <Info className="h-4 w-4" />
            About us
          </button>
          <Link href="/download" className={ITEM} onClick={() => setMenuOpen(false)}>
            <Download className="h-4 w-4" />
            Download
          </Link>
          <button
            type="button"
            className={ITEM}
            onClick={() => {
              setMenuOpen(false)
              setSettingsOpen(true)
            }}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </PopoverContent>
      </Popover>

      <ContentDialog open={aboutOpen} onOpenChange={setAboutOpen} title="About us">
        <AboutContent />
      </ContentDialog>

      {/* Mounted only once opened, so it can read localStorage straight into
          useState without a server render to reconcile against. */}
      {settingsOpen && (
        <SettingsDialog
          open
          onOpenChange={setSettingsOpen}
          onEditProfile={() => {
            setSettingsOpen(false)
            onEditProfile()
          }}
          onDeleteAccount={() => {
            setSettingsOpen(false)
            setDeleteOpen(true)
          }}
        />
      )}

      <DeleteAccountDialog
        me={me}
        username={username}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
