import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#32cda6]/30 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default: "bg-[#32cda6] text-white hover:bg-[#28a485] active:bg-[#1e7b64] border-0",
        destructive: "bg-[#ff3b30] text-white hover:bg-[#e62e24] active:bg-[#d32119] border-0",
        "destructive-outline":
          "border border-[#ff3b30]/20 bg-white text-[#ff3b30] hover:bg-[#ff3b30]/5 hover:border-[#ff3b30]/40",
        success: "bg-[#34C759] text-white hover:bg-[#30B84D] active:bg-[#2AA644] border-0",
        warning: "bg-[#FF9500] text-white hover:bg-[#E68A00] active:bg-[#CC7A00] border-0",
        outline:
          "border border-[#b3e6d9] bg-white text-[#0f2421] hover:bg-[#ecf9f5] hover:border-[#8cd9c6]",
        secondary: "bg-[#ecf9f5] text-[#0f2421] hover:bg-[#d9f2ec] border border-[#b3e6d9]",
        ghost: "text-[#0f2421] hover:bg-[#ecf9f5]",
        link: "text-[#32cda6] underline-offset-4 hover:text-[#28a485] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
