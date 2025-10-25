import * as React from "react";

import { cn } from "../lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-lg border border-[#b3e6d9] bg-white px-3 py-2 text-sm text-[#0f2421] transition-all duration-150 outline-none",
        "placeholder:text-[#3a9283]",
        "hover:border-[#8cd9c6]",
        "focus:border-[#32cda6] focus:ring-2 focus:ring-[#32cda6]/10",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[#ecf9f5] disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#0f2421]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
