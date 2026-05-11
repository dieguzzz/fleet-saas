'use client';

import { m, useReducedMotion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.2, delay: reduced ? 0 : delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function SlideUp({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </m.div>
  );
}

interface StaggerListProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerList({ children, className, staggerDelay = 0.04 }: StaggerListProps) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : staggerDelay } },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : 6 },
        visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.18, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export const MotionDiv = m.div;
export type { HTMLMotionProps };
