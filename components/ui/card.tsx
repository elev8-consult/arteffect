import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  selected?: boolean;
};

export function Card({
  className,
  interactive = false,
  selected = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-[var(--ae-white)] transition-[border-color,transform,box-shadow] duration-[var(--ae-duration-base)] ease-[var(--ae-ease-out)]",
        interactive && "hover:-translate-y-0.5 hover:border-[var(--ae-stone)] hover:shadow-[var(--ae-shadow-card)]",
        selected && "border-[var(--ae-gilt)] shadow-[0_0_0_1px_rgba(160,139,90,0.18)]",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-0", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("ae-display text-3xl leading-none text-[var(--ae-forest)]", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-[var(--muted-foreground)]", className)} {...props} />;
}

export function CardAction({ children }: { children: ReactNode }) {
  return <div className="mt-5 border-t border-[var(--border)] pt-4">{children}</div>;
}
