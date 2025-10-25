import * as React from "react"

import { cn } from "../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-lg border border-[#d2d2d7] bg-white px-3 py-2 text-sm text-[#1d1d1f] transition-all duration-150 outline-none",
        "placeholder:text-[#86868b]",
        "hover:border-[#b8b8bd]",
        "focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f5f5f7]",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#1d1d1f]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
