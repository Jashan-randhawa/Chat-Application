import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { LUXURY_PALETTES, type PaletteKey } from "@/config/palette";
import { Palette, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  compact?: boolean;
  align?: "left" | "right";
}

export default function PaletteSwitcher({ compact = false, align = "right" }: Props) {
  const { palette, setPalette } = useAppStore();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        title={`Current Theme: ${activeTheme.name}`}
        className={cn(
          "flex items-center gap-2 rounded-full border transition-all duration-200 cursor-pointer select-none",
          compact
            ? "p-2 text-muted-foreground hover:text-foreground hover:bg-accent/70 border-transparent"
            : "px-2.5 py-1.5 bg-card/80 hover:bg-accent/80 border-border/60 text-xs font-medium backdrop-blur-md shadow-xs"
        )}
      >
        <span
          className={cn(
            "w-3 h-3 rounded-full transition-transform",
            activeTheme.dotColor,
            open ? "scale-110 shadow-xs" : ""
          )}
        />
        {!compact && (
          <span className="truncate max-w-[100px] text-foreground font-semibold">
            {activeTheme.name.split(" ")[1] || activeTheme.name}
          </span>
        )}
        <Palette className={cn("w-3.5 h-3.5 text-muted-foreground", compact ? "w-4 h-4" : "")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute z-50 mt-2 w-56 rounded-2xl bg-card/95 border border-border/80 p-2 shadow-xl backdrop-blur-xl",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-1 border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Executive Palettes</span>
            </div>

            <div className="space-y-1">
              {(Object.keys(LUXURY_PALETTES) as PaletteKey[]).map((key) => {
                const item = LUXURY_PALETTES[key];
                const isActive = palette === key;

                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPalette(key);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all cursor-pointer",
                      isActive
                        ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "w-3.5 h-3.5 rounded-full shadow-xs shrink-0",
                          item.dotColor
                        )}
                      />
                      <div className="text-left">
                        <p className="leading-tight text-foreground font-medium">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{item.tagline}</p>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
