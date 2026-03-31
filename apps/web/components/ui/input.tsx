import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-13 w-full min-w-0 rounded-[24px] border border-separator bg-input px-4 py-3 text-base text-foreground shadow-soft-sm transition-[border-color,box-shadow,background-color,transform] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/80 focus-visible:-translate-y-px focus-visible:border-primary/30 focus-visible:bg-surface-elevated focus-visible:ring-4 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-fill-soft disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/15 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
