import React from "react";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  glow?: boolean;
}

const sizeMap = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
  xl: "w-14 h-14",
  "2xl": "w-20 h-20",
};

export default function AppLogo({
  size = "md",
  showWordmark = false,
  subtitle,
  className,
  glow = true,
}: AppLogoProps) {
  const iconSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Gem + Chat Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105",
          iconSize,
          glow && "drop-shadow-[0_0_12px_rgba(16,185,129,0.45)]"
        )}
      >
        <svg
          viewBox="0 0 128 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <radialGradient id="alAmbientGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="alTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="alLeft" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="alRight" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="alBottom" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
            <linearGradient id="alCenter" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a7f3d0" />
              <stop offset="45%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="alTail" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#047857" />
              <stop offset="100%" stopColor="#022c22" />
            </linearGradient>
          </defs>

          <circle cx="64" cy="62" r="56" fill="url(#alAmbientGlow)" />

          <g>
            {/* Chat Tail */}
            <path
              d="M 38 88 L 22 108 C 21 109.5 22.8 111 24.5 110 L 48 98 Z"
              fill="url(#alTail)"
            />

            {/* Facets */}
            <polygon points="40,24 64,14 64,44 40,54" fill="url(#alTop)" opacity="0.95" />
            <polygon points="64,14 88,24 88,54 64,44" fill="url(#alRight)" opacity="0.9" />
            <polygon points="24,44 40,24 40,54 24,70" fill="url(#alLeft)" />
            <polygon points="88,24 104,44 104,70 88,54" fill="url(#alRight)" />
            <polygon points="24,70 40,54 40,84 32,96" fill="url(#alBottom)" />
            <polygon points="40,54 64,64 64,96 40,84" fill="url(#alLeft)" />
            <polygon points="88,54 104,70 96,96 88,84" fill="url(#alBottom)" />
            <polygon points="64,64 88,54 88,84 64,96" fill="url(#alRight)" />

            {/* Center Table */}
            <polygon
              points="40,54 64,44 88,54 88,74 64,84 40,74"
              fill="url(#alCenter)"
            />

            {/* Signal Dots */}
            <g transform="translate(64, 64)">
              <circle cx="-14" cy="0" r="3.5" fill="#ffffff" opacity="0.95" />
              <circle cx="0" cy="0" r="4.5" fill="#ffffff" />
              <circle cx="14" cy="0" r="3.5" fill="#ffffff" opacity="0.95" />
            </g>

            {/* Highlights */}
            <polygon points="40,24 64,14 64,18 42,27" fill="#ffffff" opacity="0.65" />
            <polygon points="24,44 40,24 38,27 26,45" fill="#ffffff" opacity="0.45" />
            <line x1="41" y1="54" x2="63" y2="45" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
          </g>
        </svg>
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="font-display font-bold text-foreground tracking-tight text-base sm:text-lg">
              Emerald
            </span>
            <span className="font-display font-bold bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 bg-clip-text text-transparent text-base sm:text-lg">
              Chat
            </span>
            <span className="ml-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
              PRO
            </span>
          </div>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-medium tracking-wide mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
