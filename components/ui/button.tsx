import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-transparent text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-[var(--ae-duration-fast)] ease-[var(--ae-ease-out)] active:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--ae-red)] px-5 py-2.5 text-[var(--ae-white)] shadow-[0_8px_18px_rgba(214,39,39,0.22)] hover:bg-[var(--ae-red-hover)] hover:shadow-[0_10px_22px_rgba(168,31,31,0.28)]",
        outline:
          "border-[var(--border)] bg-transparent px-5 py-2.5 text-[var(--ae-ink)] hover:border-[var(--ae-red)] hover:bg-[var(--ae-fog)] hover:text-[var(--ae-ink)]",
        ghost:
          "px-3 py-2 text-[var(--ae-ink)] hover:bg-[color-mix(in_srgb,var(--ae-red)_12%,transparent)]",
        link:
          "h-auto min-h-0 rounded-none border-b border-transparent px-0 py-1 text-[var(--ae-ink)] hover:border-[var(--ae-red)] hover:text-[var(--ae-red)]"
      },
      size: {
        default: "h-10",
        sm: "h-9 px-3",
        lg: "h-12 px-6"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingLabel?: ReactNode;
}

export function Button({
  asChild = false,
  className,
  size,
  variant,
  loading = false,
  loadingLabel,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {loadingLabel ?? "Loading"}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}
