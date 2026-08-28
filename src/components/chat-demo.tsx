'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { emitPixels } from '@/lib/pixel-burst'
import { motionReduced } from '@/lib/prefs'

type Beat =
  | { from: 'them'; body: string; wait: number }
  | { from: 'me'; body: string }
  | { from: 'me'; file: string; size: string }

/* Short enough to read twice while deciding whether to sign up, and it shows
   the three things worth showing: presence, a typing indicator, attachments. */
const SCRIPT: Beat[] = [
  { from: 'them', body: 'you actually finished it?', wait: 1400 },
  { from: 'me', body: 'yeah. supabase realtime, one channel per chat' },
  { from: 'them', body: 'so no polling', wait: 1600 },
  { from: 'me', body: 'none. presence and typing ride the same socket' },
  { from: 'them', body: 'proof?', wait: 1300 },
  { from: 'me', file: 'screenshot.png', size: '240 KB' },
]

const BUBBLE = 'max-w-[75%] border-2 border-border px-3 py-2 text-sm shadow-pixel-sm'
const TYPE_MS = 45

/**
 * A canned conversation that plays itself, built from the same bubble treatment
 * the real thread uses. Decorative -- the copy beside it says what the product
 * is, so this is hidden from assistive tech rather than announced as it changes.
 */
export function ChatDemo() {
  const [step, setStep] = useState(0)
  const [typed, setTyped] = useState('')
  const composerRef = useRef<HTMLDivElement>(null)
  const burstRef = useRef<HTMLSpanElement>(null)

  // Every setState below sits inside a timer callback: a synchronous one in an
  // effect body is a cascading render, and this repo's lint rules reject it.
  useEffect(() => {
    // Read here, never during render -- it touches the DOM, and the server has
    // no way to know the answer.
    if (motionReduced()) {
      const id = setTimeout(() => setStep(SCRIPT.length), 0)
      return () => clearTimeout(id)
    }

    if (step >= SCRIPT.length) {
      const id = setTimeout(() => setStep(0), 3000)
      return () => clearTimeout(id)
    }

    const beat = SCRIPT[step]

    if (beat.from === 'them') {
      const id = setTimeout(() => setStep((s) => s + 1), beat.wait)
      return () => clearTimeout(id)
    }

    // An attachment is picked, not typed.
    if ('file' in beat) {
      const id = setTimeout(() => setStep((s) => s + 1), 900)
      return () => clearTimeout(id)
    }

    // Outgoing text types itself into the composer, throwing pixels as it goes.
    let at = 0
    const id = setInterval(() => {
      at += 1
      const next = beat.body.slice(0, at)
      setTyped(next)
      emitPixels(composerRef.current, burstRef.current, next)
      if (at >= beat.body.length) {
        clearInterval(id)
        setTimeout(() => {
          setTyped('')
          setStep((s) => s + 1)
        }, 420)
      }
    }, TYPE_MS)
    return () => clearInterval(id)
  }, [step])

  const sent = SCRIPT.slice(0, step)
  const waiting = SCRIPT[step]?.from === 'them'

  return (
    /* The fixed height has to fit the whole script: justify-end below overflows
       past the top edge rather than scrolling, so a taller transcript would be
       clipped against the header instead of scrolling out of view. */
    <div
      aria-hidden="true"
      className="flex h-[30rem] w-full flex-col border-2 bg-card shadow-pixel"
    >
      <header className="flex items-center gap-3 border-b-2 px-3 py-2">
        <span className="flex size-8 items-center justify-center border-2 border-border bg-primary font-mono text-sm text-primary-foreground">
          F
        </span>
        <span>
          <span className="block text-sm font-medium leading-tight">four</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 bg-presence" />
            online
          </span>
        </span>
      </header>

      {/* justify-end keeps the transcript pinned to the composer, so messages
          grow upward and nothing has to be scrolled into view. */}
      <div className="flex flex-1 flex-col justify-end gap-2 overflow-hidden p-3">
        {sent.map((beat, i) => (
          <div key={i} className={beat.from === 'me' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={[
                BUBBLE,
                beat.from === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted',
              ].join(' ')}
            >
              {'file' in beat ? (
                <span className="flex items-center gap-2">
                  <Paperclip className="size-4 shrink-0" />
                  <span className="font-mono text-xs">
                    {beat.file} · {beat.size}
                  </span>
                </span>
              ) : (
                beat.body
              )}
            </div>
          </div>
        ))}

        {waiting && (
          <span className="pixel-typing self-start pl-1 pt-1">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 border-t-2 p-2">
        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
        {/* composerRef is the measured field: it carries the padding and font
            emitPixels reads to find where the text ends. */}
        <div
          ref={composerRef}
          className="relative flex h-9 flex-1 items-center overflow-hidden border-2 border-input px-3 text-sm shadow-pixel-sm"
        >
          {typed || <span className="text-muted-foreground">Message four</span>}
          {typed && <span className="pixel-caret" />}
          <span ref={burstRef} className="pixel-burst" />
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center border-2 border-border bg-primary text-primary-foreground shadow-pixel-sm">
          <Send className="size-4" />
        </span>
      </div>
    </div>
  )
}
