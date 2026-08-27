import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * The signature pixel interaction: a hard offset shadow that the button drops
 * as it shifts into it, so pressing reads as physical depression rather than a
 * colour change. The translate is skipped under reduced-motion; the shadow
 * change alone still signals the press.
 */
const pixelSurface =
  "border-2 border-border shadow-pixel-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-pixel active:translate-x-[2px] active:translate-y-[2px] active:shadow-none motion-reduce:hover:translate-x-0 motion-reduce:hover:translate-y-0 motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground hover:bg-primary/90 ${pixelSurface}`,
        destructive: `bg-destructive text-destructive-foreground hover:bg-destructive/90 ${pixelSurface}`,
        outline: `bg-background hover:bg-accent hover:text-accent-foreground ${pixelSurface}`,
        secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80 ${pixelSurface}`,
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
