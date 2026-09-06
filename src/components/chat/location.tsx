'use client'

import { useEffect, useRef, useState } from 'react'
import { LocateFixed, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import 'leaflet/dist/leaflet.css'
import type { Map as LeafletMap } from 'leaflet'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { parseLatLng } from '@/lib/validation'
import type { Message } from '@/lib/types'

/* Opens on the whole world rather than guessing: the first thing anyone does is
   press "Use my location" or pan somewhere they already have in mind. */
const DEFAULT_VIEW = { lat: 20, lng: 0, zoom: 2 } as const
const PICKED_ZOOM = 16

/**
 * One point-in-time fix. Shared by the composer's "Current location" and the
 * dialog's recentre button, so the failure messages are written once.
 *
 * Rejects with a message meant for a toast -- the caller never sees a
 * GeolocationPositionError.
 */
export function locate(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    // Geolocation is gated on a secure context. Over plain http it is not
    // merely denied, it is absent, so this is not the same case as a refusal.
    if (!navigator.geolocation) {
      reject(new Error('This browser will not share a location over an insecure connection'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied'
              : 'Could not work out where you are',
          ),
        ),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    )
  })
}

/**
 * A received location. The map is an OpenStreetMap embed rather than a second
 * Leaflet instance: a thread can hold many of these, and an iframe costs no
 * JavaScript per bubble.
 */
export function LocationMessage({ message }: { message: Message }) {
  const point = parseLatLng(message.body)
  if (!point) return <p className="text-sm italic opacity-80">Location unavailable</p>

  const { lat, lng } = point
  // Roughly a 900 m box, so the pin has recognisable streets around it.
  const d = 0.004
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(',')

  return (
    <div className="space-y-1">
      <iframe
        title="Shared location"
        loading="lazy"
        className="h-40 w-64 max-w-full border-2 border-border"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
      />
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 text-sm underline underline-offset-2"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        Open in Maps
      </a>
      <p className="font-mono text-[10px] opacity-80">
        {lat.toFixed(5)}, {lng.toFixed(5)}
      </p>
    </div>
  )
}

type DialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (lat: number, lng: number) => void
}

/** Pan the map; whatever sits under the crosshair is what gets sent. */
export function LocationDialog({ open, onOpenChange, onPick }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [centre, setCentre] = useState<{ lat: number; lng: number }>(DEFAULT_VIEW)

  useEffect(() => {
    if (!open) return
    let map: LeafletMap | null = null
    let cancelled = false

    // Imported here, not at module scope: Leaflet touches `window` as it loads,
    // which would break the prerender. It also keeps it out of the main bundle.
    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return
      map = L.map(containerRef.current).setView(
        [DEFAULT_VIEW.lat, DEFAULT_VIEW.lng],
        DEFAULT_VIEW.zoom,
      )
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        // Required by the tile licence, not decoration.
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      map.on('move', () => {
        const c = map!.getCenter()
        setCentre({ lat: c.lat, lng: c.lng })
      })
      mapRef.current = map
    })

    return () => {
      cancelled = true
      map?.remove()
      mapRef.current = null
    }
  }, [open])

  async function recentre() {
    try {
      const { lat, lng } = await locate()
      mapRef.current?.setView([lat, lng], PICKED_ZOOM)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose on map</DialogTitle>
          <DialogDescription>
            Drag the map until the pin sits where you mean.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden border-2 border-border">
          <div ref={containerRef} className="h-full w-full" />
          {/* The pin is the picker. Sitting above the tiles but below Leaflet's
              own controls (z-index 1000) keeps the attribution clickable. */}
          <MapPin
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-[500] h-8 w-8 -translate-x-1/2 -translate-y-full fill-primary text-primary-foreground drop-shadow"
          />
        </div>

        <p className="font-mono text-xs text-muted-foreground">
          {centre.lat.toFixed(5)}, {centre.lng.toFixed(5)}
        </p>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={recentre}>
            <LocateFixed className="h-4 w-4" />
            Use my location
          </Button>
          <Button
            type="button"
            onClick={() => {
              onPick(centre.lat, centre.lng)
              onOpenChange(false)
            }}
          >
            Send this place
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
