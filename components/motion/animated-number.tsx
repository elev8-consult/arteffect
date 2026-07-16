"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { MOTION_EASE } from "@/lib/motion";

type AnimatedNumberProps = {
  prefix?: string;
  suffix?: string;
  value: number;
};

/** A one-time, in-view count-up that remains immediately legible without motion. */
export function AnimatedNumber({ prefix = "", suffix = "", value }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(reducedMotion ? value : 0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest).toLocaleString("en-US"));

  useEffect(() => {
    if (!isInView || reducedMotion) return undefined;
    const controls = animate(motionValue, value, { duration: 1.25, ease: MOTION_EASE });
    return controls.stop;
  }, [isInView, motionValue, reducedMotion, value]);

  return <span ref={ref}>{prefix}<motion.span>{rounded}</motion.span>{suffix}</span>;
}
