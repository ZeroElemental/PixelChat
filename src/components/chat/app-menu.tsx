'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Info, MoreVertical, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SettingsDialog } from './settings-dialog'

const ITEM = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'

/* The signed-in counterpart of SiteHeader's nav. A DialogTrigger nested inside
   PopoverContent would unmount with the popover before the dialog could open, so
   the dialog is a sibling driven by state instead. */
export function AppMenu({ onEditProfile }: { onEditProfile: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1">
          <Link href="/about" className={ITEM} onClick={() => setMenuOpen(false)}>
            <Info className="h-4 w-4" />
            About us
          </Link>
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
        />
      )}
    </>
  )
}
