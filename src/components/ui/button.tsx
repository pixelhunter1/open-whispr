import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center cursor-pointer justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30 focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "bg-[#007AFF] text-white hover:bg-[#0051D5] active:bg-[#004BB8] border-0",
        destructive:
          "bg-[#ff3b30] text-white hover:bg-[#e62e24] active:bg-[#d32119] border-0",
        outline:
          "border border-[#d2d2d7] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] hover:border-[#b8b8bd]",
        secondary:
          "bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed] border border-[#d2d2d7]",
        ghost:
          "text-[#1d1d1f] hover:bg-[#f5f5f7]",
        link: "text-[#007AFF] underline-offset-4 hover:text-[#0051D5] hover:underline",
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
