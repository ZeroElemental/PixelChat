'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { MessageThread } from './message-thread'
import { AddFriendDialog, FriendRequests } from './friends'
import { ProfileDialog } from './profile-dialog'
import { AppMenu } from './app-menu'
import { ConversationList } from './conversation-list'
import { useConversationChannels, useFriendNotifications } from './use-realtime'
import { beep } from '@/lib/prefs'
import { fetchPendingRequests } from '@/lib/queries'
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

  // Read by realtime callbacks, which would otherwise close over a stale value.
  const activeIdRef = useRef<string | null>(null)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const active = conversations.find((c) => c.conversation_id === activeId) ?? null

  const refreshConversations = useCallback(async () => {
    const { data } = await supabase.rpc('my_conversations')
    if (data) setConversations(data)
  }, [supabase])

  const refreshRequests = useCallback(async () => {
    setRequests(await fetchPendingRequests(supabase, me))
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

  const conversationIds = conversations.map((c) => c.conversation_id).join(',')

  const { onlineIds, typingIds, setTyping } = useConversationChannels({
    supabase,
    me,
    conversationIds,
    onMessage: (message) => {
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
    },
  })

  useFriendNotifications({
    supabase,
    me,
    onRequest: () => {
      void refreshRequests()
      toast.info('New friend request')
    },
    onAccepted: () => {
      void refreshConversations()
      toast.success('Friend request accepted')
    },
  })

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

  function handleTyping(typing: boolean) {
    if (activeId) setTyping(activeId, typing)
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
            <AppMenu
              me={me}
              username={profile.username}
              onEditProfile={() => setProfileOpen(true)}
            />
          </span>
        </header>

        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onlineIds={onlineIds}
          typingIds={typingIds}
          onSelect={openConversation}
        />
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
          onTyping={handleTyping}
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
