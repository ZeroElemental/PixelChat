import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatShell } from '@/components/chat/chat-shell'
import type { FriendRequest } from '@/lib/types'

export const metadata = { title: 'Chat · PixelChat' }

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const me = claimsData?.claims?.sub
  if (!me) redirect('/login')

  const [conversations, profile, pending] = await Promise.all([
    supabase.rpc('my_conversations'),
    supabase.from('profiles').select('username').eq('id', me).single(),
    supabase
      .from('friendships')
      .select('requester_id, profiles!friendships_requester_id_fkey(username)')
      .eq('addressee_id', me)
      .eq('status', 'pending'),
  ])

  const requests: FriendRequest[] = (pending.data ?? []).map((row) => ({
    requester_id: row.requester_id,
    username: row.profiles?.username ?? 'unknown',
  }))

  return (
    <ChatShell
      me={me}
      username={profile.data?.username ?? ''}
      initialConversations={conversations.data ?? []}
      initialRequests={requests}
    />
  )
}
