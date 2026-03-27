import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="rounded-full bg-white/10 p-2.5 text-foreground shadow-lg backdrop-blur-md transition-colors border border-white/20 dark:bg-white/5 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10"
      aria-label="Toggle theme"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </motion.button>
  );
}
