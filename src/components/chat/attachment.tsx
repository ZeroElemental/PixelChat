'use client'

import { useEffect, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'

// Attachments live in a private bucket, so every render needs a fresh signed URL.
// Storage RLS re-checks conversation membership when the URL is minted.
export function Attachment({ message }: { message: Message }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!message.attachment_path) return
    let cancelled = false
    createClient()
      .storage.from('attachments')
      .createSignedUrl(message.attachment_path, 3600)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null)
      })
    return () => {
      cancelled = true
    }
  }, [message.attachment_path])

  if (!url) {
    return <div className="h-10 w-40 animate-pulse rounded bg-muted-foreground/20" />
  }

  if (message.kind === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- signed URLs expire, so the optimizer cannot cache them
      <img
        src={url}
        alt={message.attachment_name ?? 'attachment'}
        className="max-h-64 max-w-full rounded-md"
      />
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 underline underline-offset-2"
    >
      <Paperclip className="h-4 w-4 shrink-0" />
      {message.attachment_name ?? 'Download'}
    </a>
  )
}
