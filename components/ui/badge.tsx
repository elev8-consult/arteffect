import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default: "border-[var(--ae-red)] bg-white text-[var(--ae-red)]",
        dark: "border-transparent bg-[var(--ae-red)] text-white",
        accent: "border-transparent bg-[var(--ae-red)] text-white",
        soft: "border-[var(--ae-red)]/30 bg-[color-mix(in_srgb,var(--ae-red)_10%,white)] text-[var(--ae-red)]"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        className
      )}
      {...props}
    />
  );
}
