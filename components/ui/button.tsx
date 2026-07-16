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
          "bg-[var(--ae-forest)] px-5 py-2.5 text-[var(--ae-white)] shadow-[0_8px_18px_rgba(25,43,30,0.14)] hover:bg-[var(--ae-forest-soft)] hover:shadow-[0_10px_22px_rgba(25,43,30,0.2)]",
        outline:
          "border-[var(--border)] bg-transparent px-5 py-2.5 text-[var(--ae-forest)] hover:border-[var(--ae-gilt)] hover:bg-[var(--ae-fog)] hover:text-[var(--ae-onyx)]",
        ghost:
          "px-3 py-2 text-[var(--ae-forest)] hover:bg-[rgba(160,139,90,0.12)]",
        link:
          "h-auto min-h-0 rounded-none border-b border-transparent px-0 py-1 text-[var(--ae-forest)] hover:border-[var(--ae-gilt)] hover:text-[var(--ae-onyx)]"
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
