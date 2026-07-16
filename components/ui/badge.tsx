import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em]",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-white/[0.45] text-[var(--ae-forest)]",
        dark: "border-white/20 bg-white/10 text-white",
        accent: "border-[var(--ae-gilt)]/60 bg-transparent text-[var(--ae-gilt)]"
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
