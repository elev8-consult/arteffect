import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="ae-container flex min-h-[70vh] flex-col items-start justify-center py-24">
      <p className="ae-kicker">404</p>
      <h1 className="ae-display mt-4 max-w-2xl text-5xl font-semibold text-[var(--ae-forest)] md:text-7xl">
        This edition is not in the archive.
      </h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted-foreground)]">
        The page may have moved, or the drop may not be published yet.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
