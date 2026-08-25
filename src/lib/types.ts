import type { Database } from './supabase/database.types'

export type Message = Database['public']['Tables']['messages']['Row']
export type Conversation =
  Database['public']['Functions']['my_conversations']['Returns'][number]
export type FriendRequest = { requester_id: string; username: string }

export function previewOf(message: Message): string {
  if (message.kind === 'text') return message.body ?? ''
  return message.attachment_name ?? message.kind
}
