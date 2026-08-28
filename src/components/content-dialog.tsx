'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

/**
 * The shell About and FAQ share when opened from the header or the chat menu.
 *
 * Wider than the stock sm:max-w-lg so it covers most of the screen without
 * going full bleed, and capped at 85vh so a long FAQ scrolls inside the dialog
 * rather than scrolling the page behind it.
 */
export function ContentDialog({
  open, onOpenChange, title, children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
