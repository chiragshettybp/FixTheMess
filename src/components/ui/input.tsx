import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background transition-[border-color,background-color,box-shadow,color] duration-[--motion-standard] ease-[--ease-emerge] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground placeholder:transition-opacity focus:placeholder:opacity-60 hover:border-border/80 focus-visible:border-primary/70 focus-visible:bg-accent/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-input disabled:focus-visible:border-input disabled:focus-visible:bg-background md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
