import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";

interface GlassPanelProps extends PropsWithChildren {
  className?: string;
}

export function GlassPanel({ children, className = "" }: GlassPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm shadow-[0_18px_40px_-22px_rgba(12,19,36,0.35)] ${className}`}
    >
      {children}
    </motion.section>
  );
}
