'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  // Which icon shows is decided by CSS off the `dark` class next-themes puts on
  // <html>, not by React state. The server cannot know the resolved theme, and a
  // mounted-guard effect would just be a cascading render to learn it.
  // resolvedTheme is only read inside the handler, which never runs before hydration.
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  )
}
