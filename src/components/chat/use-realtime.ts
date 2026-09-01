'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { Message } from '@/lib/types'

type Client = SupabaseClient<Database>

/**
 * Keeps the handler current without making it a subscription dependency.
 *
 * The handlers below close over component state, so a fresh one arrives on
 * every render. Depending on them directly would tear down and rebuild every
 * channel each time that state changed.
 */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  // After commit, not during render: a discarded render must not publish its
  // handler to a subscription that is still live.
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

/**
 * One private channel per conversation, carrying both the messages (broadcast)
 * and the online/typing state (presence).
 *
 * ponytail: one channel per conversation. Fine into the low hundreds; if a
 * user ever has thousands, switch to a single per-user fan-out topic.
 */
export function useConversationChannels({
  supabase,
  me,
  conversationIds,
  onMessage,
}: {
  supabase: Client
  me: string
  /** Joined rather than an array, so the effect keys on value, not identity. */
  conversationIds: string
  onMessage: (message: Message) => void
}) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set())

  const channelsRef = useRef(new Map<string, RealtimeChannel>())
  const presenceRef = useRef(new Map<string, { online: string[]; typing: string[] }>())
  const onMessageRef = useLatest(onMessage)

  // Presence is tracked per channel but presented as one set across all of them.
  const recomputePresence = useCallback(() => {
    const online = new Set<string>()
    const typing = new Set<string>()
    for (const entry of presenceRef.current.values()) {
      entry.online.forEach((id) => online.add(id))
      entry.typing.forEach((id) => typing.add(id))
    }
    setOnlineIds(online)
    setTypingIds(typing)
  }, [])

  useEffect(() => {
    const ids = conversationIds ? conversationIds.split(',') : []
    let cancelled = false

    async function subscribe() {
      // Private channels are authorized against the caller's JWT, so the token
      // has to be handed to the realtime socket before joining.
      await supabase.realtime.setAuth()
      if (cancelled) return

      for (const id of ids) {
        if (channelsRef.current.has(id)) continue

        const channel = supabase.channel(`conversation:${id}`, {
          // enabled:true is required for this client to receive presence state;
          // a presence listener alone would enable it implicitly, which is easy to break.
          config: { private: true, presence: { key: me, enabled: true } },
        })

        channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
          onMessageRef.current(payload as Message)
        })

        channel.on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<{ typing?: boolean }>()
          const online: string[] = []
          const typing: string[] = []
          for (const [key, metas] of Object.entries(state)) {
            if (key === me) continue
            online.push(key)
            if (metas.some((meta) => meta.typing)) typing.push(key)
          }
          presenceRef.current.set(id, { online, typing })
          recomputePresence()
        })

        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') void channel.track({ typing: false })
        })

        channelsRef.current.set(id, channel)
      }

      // Drop channels for conversations that no longer exist.
      for (const [id, channel] of channelsRef.current) {
        if (!ids.includes(id)) {
          void supabase.removeChannel(channel)
          channelsRef.current.delete(id)
          presenceRef.current.delete(id)
        }
      }
      recomputePresence()
    }

    void subscribe()
    return () => {
      cancelled = true
    }
  }, [conversationIds, supabase, me, recomputePresence, onMessageRef])

  // Unsubscribe everything only when the whole shell goes away.
  useEffect(() => {
    const channels = channelsRef.current
    return () => {
      for (const channel of channels.values()) void supabase.removeChannel(channel)
      channels.clear()
    }
  }, [supabase])

  // Callers name a conversation; the channel map stays in here.
  const setTyping = useCallback((conversationId: string, typing: boolean) => {
    void channelsRef.current.get(conversationId)?.track({ typing })
  }, [])

  return { onlineIds, typingIds, setTyping }
}

/**
 * Private inbox for friend-request notifications. Clients can read this topic
 * but not write to it, so a notification cannot be forged.
 */
export function useFriendNotifications({
  supabase,
  me,
  onRequest,
  onAccepted,
}: {
  supabase: Client
  me: string
  onRequest: () => void
  onAccepted: () => void
}) {
  const onRequestRef = useLatest(onRequest)
  const onAcceptedRef = useLatest(onAccepted)

  useEffect(() => {
    let channel: RealtimeChannel | null = null
    let cancelled = false

    async function subscribe() {
      await supabase.realtime.setAuth()
      if (cancelled) return
      channel = supabase.channel(`user:${me}`, { config: { private: true } })
      channel.on('broadcast', { event: 'friendship' }, ({ payload }) => {
        if (payload.status === 'pending') onRequestRef.current()
        else if (payload.status === 'accepted') onAcceptedRef.current()
      })
      channel.subscribe()
    }

    void subscribe()
    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [supabase, me, onRequestRef, onAcceptedRef])
}
