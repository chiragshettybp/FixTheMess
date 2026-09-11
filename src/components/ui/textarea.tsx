import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-[border-color,background-color,box-shadow,color] duration-[--motion-standard] ease-[--ease-emerge] placeholder:text-muted-foreground placeholder:transition-opacity focus:placeholder:opacity-60 hover:border-border/80 focus-visible:border-primary/70 focus-visible:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:focus-visible:border-input disabled:focus-visible:bg-background",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
