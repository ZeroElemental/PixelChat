'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, FileArchive, FileText, Image as ImageIcon, Paperclip, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { UserAvatar } from '@/components/user-avatar'
import { Attachment } from './attachment'
import { ATTACHMENT_GROUPS, ATTACHMENT_MIME, ATTACHMENT_RULE, checkFile } from '@/lib/validation'
import { emitPixels } from '@/lib/pixel-burst'
import type { Conversation, Message } from '@/lib/types'

const ITEM = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted'

const ATTACH_ICON = { Photo: ImageIcon, Document: FileText, Archive: FileArchive }

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
  /* Mobile shows one pane at a time, so the thread needs a way back to the list. */
  onBack: () => void
}

export function MessageThread({
  me, conversation, messages, isOnline, isTyping, hasMore,
  onSend, onUpload, onTyping, onLoadOlder, onBack,
}: Props) {
  const [draft, setDraft] = useState('')
  const [attachOpen, setAttachOpen] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const burstRef = useRef<HTMLSpanElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
  }, [])

  function handleDraft(value: string) {
    if (value.length > draft.length) emitPixels(inputRef.current, burstRef.current, value)
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

  /* Narrows the dialog to one group. The attribute is set on the node rather than
     through state because React would not flush a re-render before .click(), so the
     dialog would open with the previous group's filter. */
  function openPicker(accept: string) {
    setAttachOpen(false)
    const input = fileRef.current
    if (!input) return
    input.accept = accept
    input.click()
  }

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const problem = checkFile(file, ATTACHMENT_RULE)
    if (problem) {
      toast.error(problem)
      return
    }
    onUpload(file)
  }

  return (
    <section className="flex min-w-0 flex-1 flex-col">
      <header className="flex items-center gap-3 border-b-2 px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 md:hidden"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <UserAvatar
          className="h-9 w-9"
          name={conversation.other_username}
          avatarUrl={conversation.other_avatar_url}
        />
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
                  'max-w-[75%] border-2 border-border px-3 py-2 text-sm shadow-pixel-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                ].join(' ')}
              >
                {message.kind === 'text'
                  ? <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  : <Attachment message={message} />}
                <time
                  dateTime={message.created_at}
                  className="mt-1 block font-mono text-[10px] opacity-80"
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

      <form onSubmit={submit} className="flex items-center gap-2 border-t-2 p-3">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept={ATTACHMENT_MIME.join(',')}
          onChange={pickFile}
        />
        {/* The file input stays a sibling: inside PopoverContent it would unmount
            with the popover before the dialog could open. */}
        <Popover open={attachOpen} onOpenChange={setAttachOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label="Attach a file">
              <Paperclip className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-44 p-1">
            {ATTACHMENT_GROUPS.map((group) => {
              const Icon = ATTACH_ICON[group.label]
              return (
                <button
                  key={group.label}
                  type="button"
                  className={ITEM}
                  onClick={() => openPicker(group.mime.join(','))}
                >
                  <Icon className="h-4 w-4" />
                  {group.label}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
        <span className="relative flex flex-1">
          <Input
            ref={inputRef}
            value={draft}
            onChange={(e) => handleDraft(e.target.value)}
            placeholder={`Message ${conversation.other_username}`}
            maxLength={4000}
            aria-label="Message"
          />
          {/* Where the burst spawns. Decorative, so it takes no pointer events
              and is hidden from assistive tech. */}
          <span ref={burstRef} className="pixel-burst" aria-hidden="true" />
        </span>
        <Button type="submit" size="icon" aria-label="Send" disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
