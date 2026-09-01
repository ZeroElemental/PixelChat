import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatShell } from '@/components/chat/chat-shell'
import { fetchPendingRequests } from '@/lib/queries'

export const metadata = { title: 'Chat · PixelChat' }

export default async function ChatPage() {
  const supabase = await createClient()

  const { data: claimsData } = await supabase.auth.getClaims()
  const me = claimsData?.claims?.sub
  if (!me) redirect('/login')

  const [conversations, profile, requests] = await Promise.all([
    supabase.rpc('my_conversations'),
    supabase.from('profiles').select('username, avatar_url').eq('id', me).single(),
    fetchPendingRequests(supabase, me),
  ])

  return (
    <ChatShell
      me={me}
      username={profile.data?.username ?? ''}
      avatarUrl={profile.data?.avatar_url ?? null}
      initialConversations={conversations.data ?? []}
      initialRequests={requests}
    />
  )
}
