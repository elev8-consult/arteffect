"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { MOTION_EASE } from "@/lib/motion";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reducedMotion ? false : { opacity: 0, y: 6 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: 0.32, ease: MOTION_EASE }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
