'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageThread } from './message-thread'
import { AddFriendDialog, FriendRequests } from './friends'
import { ProfileDialog } from './profile-dialog'
import { AppMenu } from './app-menu'
import { beep } from '@/lib/prefs'
import { previewOf, type Conversation, type FriendRequest, type Message } from '@/lib/types'
import { usernameSchema } from '@/lib/validation'

const PAGE_SIZE = 50

type Props = {
  me: string
  username: string
  avatarUrl: string | null
  initialConversations: Conversation[]
  initialRequests: FriendRequest[]
}

export function ChatShell({
  me,
  username,
  avatarUrl,
  initialConversations,
  initialRequests,
}: Props) {
  const supabase = useMemo(() => createClient(), [])

  // Editable in the profile dialog, so it outgrows the server-rendered prop.
  const [profile, setProfile] = useState({ username, avatarUrl })
  // Lifted out of ProfileDialog so Settings can open it as well as the trigger.
  const [profileOpen, setProfileOpen] = useState(false)

  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [requests, setRequests] = useState<FriendRequest[]>(initialRequests)
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [typingIds, setTypingIds] = useState<Set<string>>(new Set())

  // Read by realtime callbacks, which would otherwise close over a stale value.
  const activeIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const channelsRef = useRef(new Map<string, RealtimeChannel>())
  const presenceRef = useRef(new Map<string, { online: string[]; typing: string[] }>())

  const active = conversations.find((c) => c.conversation_id === activeId) ?? null

  const refreshConversations = useCallback(async () => {
    const { data } = await supabase.rpc('my_conversations')
    if (data) setConversations(data)
  }, [supabase])

  const refreshRequests = useCallback(async () => {
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, profiles!friendships_requester_id_fkey(username)')
      .eq('addressee_id', me)
      .eq('status', 'pending')
    setRequests(
      (data ?? []).map((row) => ({
        requester_id: row.requester_id,
        username: row.profiles?.username ?? 'unknown',
      })),
    )
  }, [supabase, me])

  const markRead = useCallback(
    async (conversationId: string) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.conversation_id === conversationId ? { ...c, unread_count: 0 } : c,
        ),
      )
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', me)
    },
    [supabase, me],
  )

  // --- realtime -------------------------------------------------------------
  // One private channel per conversation carries both the messages (broadcast)
  // and the online/typing state (presence).
  // ponytail: one channel per conversation. Fine into the low hundreds; if a
  // user ever has thousands, switch to a single per-user fan-out topic.
  const conversationIds = conversations.map((c) => c.conversation_id).join(',')

  useEffect(() => {
    const ids = conversationIds ? conversationIds.split(',') : []
    let cancelled = false

    function recomputePresence() {
      const online = new Set<string>()
      const typing = new Set<string>()
      for (const entry of presenceRef.current.values()) {
        entry.online.forEach((id) => online.add(id))
        entry.typing.forEach((id) => typing.add(id))
      }
      setOnlineIds(online)
      setTypingIds(typing)
    }

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
          const message = payload as Message

          // Reads the setting at call time, so toggling it takes effect without
          // tearing down and rebuilding every subscription.
          if (message.sender_id !== me) beep()

          setConversations((prev) =>
            [...prev]
              .map((c) =>
                c.conversation_id === message.conversation_id
                  ? {
                      ...c,
                      last_message_at: message.created_at,
                      last_message_preview: previewOf(message),
                      unread_count:
                        message.sender_id !== me &&
                        activeIdRef.current !== message.conversation_id
                          ? c.unread_count + 1
                          : c.unread_count,
                    }
                  : c,
              )
              .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at)),
          )

          if (activeIdRef.current === message.conversation_id) {
            // Also reconciles our own optimistic copy with the stored row.
            setMessages((prev) => {
              const at = prev.findIndex((m) => m.id === message.id)
              if (at === -1) return [...prev, message]
              const next = [...prev]
              next[at] = message
              return next
            })
            if (message.sender_id !== me) void markRead(message.conversation_id)
          }
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
  }, [conversationIds, supabase, me, markRead])

  // Unsubscribe everything only when the whole shell goes away.
  useEffect(() => {
    const channels = channelsRef.current
    return () => {
      for (const channel of channels.values()) void supabase.removeChannel(channel)
      channels.clear()
    }
  }, [supabase])

  // Private inbox for friend-request notifications. Clients can read this topic
  // but not write to it, so a notification cannot be forged.
  useEffect(() => {
    let channel: RealtimeChannel | null = null
    let cancelled = false

    async function subscribe() {
      await supabase.realtime.setAuth()
      if (cancelled) return
      channel = supabase.channel(`user:${me}`, { config: { private: true } })
      channel.on('broadcast', { event: 'friendship' }, ({ payload }) => {
        if (payload.status === 'pending') {
          void refreshRequests()
          toast.info('New friend request')
        } else if (payload.status === 'accepted') {
          void refreshConversations()
          toast.success('Friend request accepted')
        }
      })
      channel.subscribe()
    }

    void subscribe()
    return () => {
      cancelled = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [supabase, me, refreshRequests, refreshConversations])

  // --- actions --------------------------------------------------------------

  async function openConversation(id: string) {
    setActiveId(id)
    setMessages([])
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (error) {
      toast.error('Could not load messages')
      return
    }
    setMessages((data ?? []).reverse())
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
    void markRead(id)
  }

  async function loadOlder() {
    if (!activeId || messages.length === 0) return
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', activeId)
      .lt('created_at', messages[0].created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    setMessages((prev) => [...(data ?? []).reverse(), ...prev])
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
  }

  async function send(body: string) {
    if (!activeId) return
    // Client-generated id so the optimistic row and the broadcast echo match.
    const id = crypto.randomUUID()
    const optimistic: Message = {
      id,
      conversation_id: activeId,
      sender_id: me,
      body,
      attachment_path: null,
      attachment_name: null,
      kind: 'text',
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase.from('messages').insert({
      id,
      conversation_id: activeId,
      sender_id: me,
      body,
      kind: 'text',
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== id))
      toast.error('Message not sent')
    }
  }

  async function upload(file: File) {
    if (!activeId) return
    const safeName = file.name.replace(/[^\w.\-]/g, '_')
    const path = `${activeId}/${crypto.randomUUID()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      toast.error('Upload failed')
      return
    }

    const { error } = await supabase.from('messages').insert({
      conversation_id: activeId,
      sender_id: me,
      kind: file.type.startsWith('image/') ? 'image' : 'file',
      attachment_path: path,
      attachment_name: file.name,
    })

    if (error) toast.error('Could not attach that file')
  }

  function setTyping(typing: boolean) {
    if (!activeId) return
    void channelsRef.current.get(activeId)?.track({ typing })
  }

  async function addFriend(name: string): Promise<boolean> {
    const parsed = usernameSchema.safeParse(name)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message)
      return false
    }
    if (parsed.data.toLowerCase() === profile.username.toLowerCase()) {
      toast.error("You can't add yourself")
      return false
    }

    const { data: target } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', parsed.data)
      .maybeSingle()

    if (!target) {
      toast.error('No user with that username')
      return false
    }

    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: me, addressee_id: target.id, status: 'pending' })

    if (error) {
      // The pair-unique index covers requests in either direction.
      toast.error(
        error.code === '23505'
          ? 'You already have a request or friendship with them'
          : 'Could not send that request',
      )
      return false
    }

    toast.success('Friend request sent')
    return true
  }

  async function acceptRequest(requesterId: string) {
    const { error } = await supabase.rpc('accept_friend_request', {
      request_from: requesterId,
    })
    if (error) {
      toast.error('That request is no longer available')
    } else {
      toast.success('Friend added')
      await Promise.all([refreshConversations(), refreshRequests()])
    }
  }

  async function rejectRequest(requesterId: string) {
    await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', requesterId)
      .eq('addressee_id', me)
    await refreshRequests()
  }

  // --- render ---------------------------------------------------------------

  return (
    <div className="flex h-dvh bg-background text-foreground">
      {/* One pane at a time below md: the list, or the open thread. Side by side
          from md up. A fixed 288px rail leaves no room for messages on a phone. */}
      <aside
        className={[
          active ? 'hidden md:flex' : 'flex',
          'w-full shrink-0 flex-col border-r-2 md:w-72',
        ].join(' ')}
      >
        <header className="flex items-center justify-between border-b-2 px-3 py-3">
          <ProfileDialog
            me={me}
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            onSaved={setProfile}
            open={profileOpen}
            onOpenChange={setProfileOpen}
          />
          <span className="flex items-center">
            <AddFriendDialog onAdd={addFriend} />
            <FriendRequests
              requests={requests}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />
            <AppMenu onEditProfile={() => setProfileOpen(true)} />
          </span>
        </header>

        <nav className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              No chats yet. Add a friend to get started.
            </p>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.conversation_id}
              onClick={() => openConversation(conversation.conversation_id)}
              aria-current={conversation.conversation_id === activeId}
              className={[
                'flex w-full items-center gap-3 border-2 p-2 text-left transition-colors',
                conversation.conversation_id === activeId
                  ? 'border-border bg-muted'
                  : 'border-transparent hover:border-border hover:bg-muted/50',
              ].join(' ')}
            >
              <span className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  {conversation.other_avatar_url && (
                    <AvatarImage src={conversation.other_avatar_url} alt="" />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {conversation.other_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {onlineIds.has(conversation.other_id) && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-presence ring-2 ring-background" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {conversation.other_username}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {typingIds.has(conversation.other_id)
                    ? 'typing…'
                    : conversation.last_message_preview ?? 'No messages yet'}
                </span>
              </span>
              {conversation.unread_count > 0 && (
                <span className="shrink-0 border-2 border-border bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">
                  {conversation.unread_count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {active ? (
        <MessageThread
          me={me}
          conversation={active}
          messages={messages}
          isOnline={onlineIds.has(active.other_id)}
          isTyping={typingIds.has(active.other_id)}
          hasMore={hasMore}
          onSend={send}
          onUpload={upload}
          onTyping={setTyping}
          onLoadOlder={loadOlder}
          onBack={() => setActiveId(null)}
        />
      ) : (
        <section className="hidden flex-1 items-center justify-center md:flex">
          <p className="text-muted-foreground">Pick a conversation to start chatting.</p>
        </section>
      )}
    </div>
  )
}
