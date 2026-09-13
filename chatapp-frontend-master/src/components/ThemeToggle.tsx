import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  /** 'icon' for a compact button, 'switch' for a full row with label and animated pill toggle */
  variant?: "icon" | "switch";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = "icon", className = "" }) => {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("chatapp-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("chatapp-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const isDark = theme === "dark";

  if (variant === "switch") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className={`flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer min-h-[40px] select-none ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
          </div>
          <span>{isDark ? "Dark Theme" : "Light Theme"}</span>
        </div>

        {/* Animated toggle pill */}
        <div
          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 border flex items-center ${
            isDark
              ? "bg-emerald-500/20 border-emerald-500/40 justify-end"
              : "bg-muted border-border justify-start"
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full transition-transform duration-200 shadow-xs flex items-center justify-center ${
              isDark ? "bg-emerald-400 text-slate-950" : "bg-white text-amber-500"
            }`}
          >
            {isDark ? <Moon className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`p-2 rounded-xl border border-border/80 bg-card/80 text-foreground hover:bg-muted/50 transition-all duration-200 cursor-pointer shadow-xs min-h-[36px] min-w-[36px] flex items-center justify-center btn-tactile ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
