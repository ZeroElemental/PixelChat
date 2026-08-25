'use client'

import { useEffect, useRef, useState } from 'react'
import { Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Attachment } from './attachment'
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MIME } from '@/lib/validation'
import type { Conversation, Message } from '@/lib/types'

type Props = {
  me: string
  conversation: Conversation
  messages: Message[]
  isOnline: boolean
  isTyping: boolean
  hasMore: boolean
  onSend: (body: string) => void
  onUpload: (file: File) => void
  onTyping: (typing: boolean) => void
  onLoadOlder: () => void
}

export function MessageThread({
  me, conversation, messages, isOnline, isTyping, hasMore,
  onSend, onUpload, onTyping, onLoadOlder,
}: Props) {
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }, [])

  function handleDraft(value: string) {
    setDraft(value)
    onTyping(true)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => onTyping(false), 2000)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    setDraft('')
    onTyping(false)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    onSend(body)
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    // The bucket enforces both of these too; checking here just avoids a
    // pointless upload and gives a better message.
    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast.error('Files must be 10 MB or smaller')
      return
    }
    if (!(ATTACHMENT_MIME as readonly string[]).includes(file.type)) {
      toast.error('That file type is not allowed')
      return
    }
    onUpload(file)
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {conversation.other_username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium leading-tight">{conversation.other_username}</p>
          <p className="text-xs text-muted-foreground">
            {isTyping ? 'typing…' : isOnline ? 'online' : 'offline'}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {hasMore && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onLoadOlder}>
              Load older messages
            </Button>
          </div>
        )}

        {messages.map((message) => {
          const mine = message.sender_id === me
          return (
            <div key={message.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={[
                  'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                ].join(' ')}
              >
                {message.kind === 'text'
                  ? <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  : <Attachment message={message} />}
                <time
                  dateTime={message.created_at}
                  className="mt-1 block text-[10px] opacity-60"
                >
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <p className="text-xs text-muted-foreground">
            {conversation.other_username} is typing…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={ATTACHMENT_MIME.join(',')}
          onChange={pickFile}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach a file"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Input
          value={draft}
          onChange={(e) => handleDraft(e.target.value)}
          placeholder={`Message ${conversation.other_username}`}
          maxLength={4000}
          aria-label="Message"
        />
        <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
