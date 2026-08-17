"use client";

import { motion, useReducedMotion } from "motion/react";
import { durations, easeOut } from "@/presentation/lib/motion";

/** Subtle entrance transition on every in-app navigation. */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.slow, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
