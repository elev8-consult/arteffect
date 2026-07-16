import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateMessageProps = {
  action?: ReactNode;
  className?: string;
  description: string;
  title: string;
  type?: "empty" | "error" | "loading";
};

export function StateMessage({
  action,
  className,
  description,
  title,
  type = "empty"
}: StateMessageProps) {
  const Icon = type === "loading" ? LoaderCircle : type === "error" ? AlertCircle : Inbox;

  return (
    <div
      className={cn("flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--ae-fog)]/45 px-6 py-9 text-center", className)}
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <Icon className={cn("size-5 text-[var(--ae-gilt)]", type === "loading" && "animate-spin")} aria-hidden="true" />
      <p className="mt-4 text-sm font-medium text-[var(--ae-forest)]">{title}</p>
      <p className="mt-1 max-w-xs text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function RetryButton({ onClick }: { onClick: () => void }) {
  return <Button type="button" size="sm" variant="outline" onClick={onClick}>Try again</Button>;
}
