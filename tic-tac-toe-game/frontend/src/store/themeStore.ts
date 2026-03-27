import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark";

interface ThemeStore {
  mode: ThemeMode;
  hydrateTheme: () => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const applyThemeClass = (mode: ThemeMode) => {
  const html = document.documentElement;
  html.classList.remove("light", "dark");
  html.classList.add(mode);
};

const getPreferredTheme = (): ThemeMode => {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: "dark",
      hydrateTheme: () => {
        const legacy = localStorage.getItem("ttt-theme");
        const mode = legacy === "light" || legacy === "dark" ? legacy : get().mode;
        applyThemeClass(mode);
        if (legacy === "light" || legacy === "dark") {
          set({ mode: legacy });
          localStorage.removeItem("ttt-theme");
        }
      },
      toggleTheme: () => {
        const next = get().mode === "dark" ? "light" : "dark";
        applyThemeClass(next);
        set({ mode: next });
      },
      setTheme: (mode) => {
        applyThemeClass(mode);
        set({ mode });
      },
    }),
    {
      name: "ttt-theme-store",
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        const storedMode = state.mode;
        const mode = storedMode === "light" || storedMode === "dark" ? storedMode : getPreferredTheme();
        state.setTheme(mode);
      },
    },
  ),
);
