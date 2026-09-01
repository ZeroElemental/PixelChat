import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

type Props = {
  /** Drives the initial shown when there is no image. */
  name: string
  avatarUrl?: string | null
  className?: string
  /** Only the type scale really varies between call sites. */
  fallbackClassName?: string
}

// Lives outside components/ui because that directory is regenerated shadcn
// output -- edits there are lost the next time a primitive is re-added.
export function UserAvatar({ name, avatarUrl, className, fallbackClassName }: Props) {
  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
      <AvatarFallback className={cn('bg-primary text-primary-foreground', fallbackClassName)}>
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
