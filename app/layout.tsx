import type { ReactNode } from "react";

import "./globals.css";

/**
 * Root layout is a pass-through so route groups can own the document shell.
 * The storefront uses `app/(site)/layout.tsx`. Payload admin uses
 * `app/(payload)/layout.tsx`, which renders its own <html>/<body>.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
