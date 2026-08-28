/**
 * Two viewer-local preferences, kept in localStorage because neither belongs to
 * the account: the machine you are on is what decides whether motion is welcome
 * and whether a sound is. Every access is guarded -- localStorage throws outright
 * in some privacy modes, and none of this is worth breaking a page over.
 */

export const MOTION_KEY = 'pixelchat-motion'
export const SOUND_KEY = 'pixelchat-sound'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* nothing to do; the setting just will not survive the reload */
  }
}

/** True when either the OS asks for less motion or the in-app toggle is on. */
export function motionReduced(): boolean {
  if (typeof document === 'undefined') return false
  return (
    document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function motionOff(): boolean {
  return read(MOTION_KEY) === 'off'
}

export function setMotionOff(off: boolean) {
  write(MOTION_KEY, off ? 'off' : 'on')
  document.documentElement.classList.toggle('reduce-motion', off)
}

export function soundOn(): boolean {
  return read(SOUND_KEY) === 'on'
}

export function setSoundOn(on: boolean) {
  write(SOUND_KEY, on ? 'on' : 'off')
}

// ponytail: one context reused for the life of the tab. Created lazily so it is
// only ever built after a user gesture, which is what autoplay policy wants.
let audio: AudioContext | null = null

/** A short square-wave blip -- the retro-correct sound, and no asset to ship. */
export function beep() {
  if (!soundOn()) return
  try {
    audio ??= new AudioContext()
    void audio.resume()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = 'square'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.04, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.08)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + 0.08)
  } catch {
    /* blocked or unsupported audio must never break message delivery */
  }
}
