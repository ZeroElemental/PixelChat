'use client'

import { useRef } from 'react'
import { clampRail, RAIL_DEFAULT, RAIL_MAX, RAIL_MIN } from '@/lib/prefs'

type Props = {
  width: number
  onChange: (width: number) => void
  /* Fired once a drag or key press settles, so storage is written once rather
     than on every pointermove. */
  onCommit: (width: number) => void
}

const STEP = 16

/**
 * The drag handle on the rail's right border. A window splitter in ARIA terms:
 * focusable, arrow keys nudge it, Home/End jump to the bounds, double-click
 * resets. Desktop only -- below md the rail is the whole screen.
 */
export function RailResizer({ width, onChange, onCommit }: Props) {
  // Offset between the pointer and the rail's edge when the drag began, so the
  // edge doesn't jump to the pointer's exact x.
  const grab = useRef<number | null>(null)

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    grab.current = event.clientX - width
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (grab.current === null) return
    onChange(clampRail(event.clientX - grab.current))
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (grab.current === null) return
    const final = clampRail(event.clientX - grab.current)
    grab.current = null
    onChange(final)
    onCommit(final)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const next = {
      ArrowLeft: width - STEP,
      ArrowRight: width + STEP,
      Home: RAIL_MIN,
      End: RAIL_MAX,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onChange(clampRail(next))
    onCommit(clampRail(next))
  }

  function reset() {
    onChange(RAIL_DEFAULT)
    onCommit(RAIL_DEFAULT)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize conversation list"
      aria-valuemin={RAIL_MIN}
      aria-valuemax={RAIL_MAX}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      onDoubleClick={reset}
      className="relative z-10 -ml-1.5 hidden w-2.5 shrink-0 cursor-col-resize touch-none outline-none transition-colors hover:bg-primary/40 focus-visible:bg-primary/60 active:bg-primary/60 md:block"
    />
  )
}
