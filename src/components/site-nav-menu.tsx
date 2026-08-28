'use client'

import { useState } from 'react'
import { NavLink } from '@/components/nav-link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/* The md-and-down half of SiteHeader. Popover rather than a new dropdown-menu
   dependency -- it is already installed and already used by the friend list. */
export function SiteNavMenu({ links }: { links: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1">
        {links.map((link) => (
          <NavLink
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-muted"
          >
            {link.label}
          </NavLink>
        ))}
      </PopoverContent>
    </Popover>
  )
}
