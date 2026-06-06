import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  /** Optional ARIA role for the wrapper. */
  role?: string;
}

/**
 * Wraps a page in a motion container for the AnimatePresence-driven
 * route transitions (Task 12.3). The element is keyed by its parent
 * (AnimatePresence in App.tsx) so exit/enter animations chain cleanly.
 * Animations short-circuit to zero duration under prefers-reduced-motion.
 */
export function PageTransition({ children, role }: PageTransitionProps) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      role={role}
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -6 }}
      transition={{ duration: reduced ? 0 : 0.18, ease: "easeOut" }}
      className="contents"
    >
      {children}
    </motion.div>
  );
}
