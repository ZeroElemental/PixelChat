import { UserAvatar } from '@/components/user-avatar'
import type { Conversation } from '@/lib/types'

type Props = {
  conversations: Conversation[]
  activeId: string | null
  onlineIds: Set<string>
  typingIds: Set<string>
  onSelect: (conversationId: string) => void
}

export function ConversationList({
  conversations,
  activeId,
  onlineIds,
  typingIds,
  onSelect,
}: Props) {
  return (
    <nav className="flex-1 overflow-y-auto p-2">
      {conversations.length === 0 && (
        <p className="p-3 text-sm text-muted-foreground">
          No chats yet. Add a friend to get started.
        </p>
      )}
      {conversations.map((conversation) => (
        <button
          key={conversation.conversation_id}
          onClick={() => onSelect(conversation.conversation_id)}
          aria-current={conversation.conversation_id === activeId}
          className={[
            'flex w-full items-center gap-3 border-2 p-2 text-left transition-colors',
            conversation.conversation_id === activeId
              ? 'border-border bg-muted'
              : 'border-transparent hover:border-border hover:bg-muted/50',
          ].join(' ')}
        >
          <span className="relative shrink-0">
            <UserAvatar
              className="h-9 w-9"
              name={conversation.other_username}
              avatarUrl={conversation.other_avatar_url}
            />
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
  )
}
