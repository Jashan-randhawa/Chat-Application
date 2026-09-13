export type PaletteKey = "violet" | "cobalt" | "emerald" | "rose";

export interface PaletteTheme {
  key: PaletteKey;
  name: string;
  tagline: string;
  dotColor: string;
  badgeClass: string;
  sentBubbleClass: string;
  sentBubbleText: string;
  accentText: string;
  borderAccent: string;
  primaryGradient: string;
  glowShadow: string;
  canvasDark: string;
  canvasLight: string;
  activeNavClass: string;
  sendBtnClass: string;
  waveActiveColor: string;
  waveInactiveColor: string;
}

export const LUXURY_PALETTES: Record<PaletteKey, PaletteTheme> = {
  violet: {
    key: "violet",
    name: "Obsidian Iris",
    tagline: "Elegance & Mystique",
    dotColor: "bg-violet-500",
    badgeClass: "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/25",
    sentBubbleClass: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-violet-950/20 border-t border-white/20",
    sentBubbleText: "text-white",
    accentText: "text-violet-600 dark:text-violet-400",
    borderAccent: "border-violet-500/30",
    primaryGradient: "from-violet-600 via-purple-600 to-indigo-600",
    glowShadow: "shadow-[0_0_20px_rgba(139,92,246,0.35)]",
    canvasDark: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(139,92,246,0.12)_0%,transparent_60%),linear-gradient(180deg,#090714_0%,#0c0b1a_50%,#05040a_100%)]",
    canvasLight: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(237,233,254,0.7)_0%,transparent_60%),linear-gradient(180deg,#faf8ff_0%,#f5f3ff_50%,#ffffff_100%)]",
    activeNavClass: "bg-violet-600 text-white shadow-md shadow-violet-600/30",
    sendBtnClass: "bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/30",
    waveActiveColor: "#a78bfa",
    waveInactiveColor: "rgba(167, 139, 250, 0.25)",
  },
  cobalt: {
    key: "cobalt",
    name: "Midnight Sapphire",
    tagline: "Deep Ocean & Clarity",
    dotColor: "bg-sky-500",
    badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/25",
    sentBubbleClass: "bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-800 text-white shadow-md shadow-blue-950/25 border-t border-white/20",
    sentBubbleText: "text-white",
    accentText: "text-sky-600 dark:text-sky-400",
    borderAccent: "border-sky-500/30",
    primaryGradient: "from-sky-500 via-blue-600 to-indigo-600",
    glowShadow: "shadow-[0_0_20px_rgba(14,165,233,0.35)]",
    canvasDark: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(14,165,233,0.12)_0%,transparent_60%),linear-gradient(180deg,#040d1a_0%,#071426_50%,#02060d_100%)]",
    canvasLight: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(224,242,254,0.7)_0%,transparent_60%),linear-gradient(180deg,#f0f9ff_0%,#e0f2fe_50%,#ffffff_100%)]",
    activeNavClass: "bg-sky-600 text-white shadow-md shadow-sky-600/30",
    sendBtnClass: "bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-md shadow-sky-600/30",
    waveActiveColor: "#38bdf8",
    waveInactiveColor: "rgba(56, 189, 248, 0.25)",
  },
  emerald: {
    key: "emerald",
    name: "Imperial Emerald",
    tagline: "Prestige & Freshness",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/25",
    sentBubbleClass: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 text-white shadow-md shadow-emerald-950/25 border-t border-white/20",
    sentBubbleText: "text-white",
    accentText: "text-emerald-600 dark:text-emerald-400",
    borderAccent: "border-emerald-500/30",
    primaryGradient: "from-emerald-500 via-teal-600 to-emerald-700",
    glowShadow: "shadow-[0_0_20px_rgba(16,185,129,0.35)]",
    canvasDark: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(16,185,129,0.12)_0%,transparent_60%),linear-gradient(180deg,#06130e_0%,#0b1f18_50%,#030906_100%)]",
    canvasLight: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(209,250,229,0.7)_0%,transparent_60%),linear-gradient(180deg,#f0fdf4_0%,#ecfdf5_50%,#ffffff_100%)]",
    activeNavClass: "bg-emerald-600 text-white shadow-md shadow-emerald-600/30",
    sendBtnClass: "bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-600/30",
    waveActiveColor: "#34d399",
    waveInactiveColor: "rgba(52, 211, 153, 0.25)",
  },
  rose: {
    key: "rose",
    name: "Sunset Rose",
    tagline: "Warmth & Passion",
    dotColor: "bg-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/25",
    sentBubbleClass: "bg-gradient-to-br from-rose-600 via-pink-600 to-amber-700 text-white shadow-md shadow-rose-950/25 border-t border-white/20",
    sentBubbleText: "text-white",
    accentText: "text-rose-600 dark:text-rose-400",
    borderAccent: "border-rose-500/30",
    primaryGradient: "from-rose-500 via-pink-600 to-amber-600",
    glowShadow: "shadow-[0_0_20px_rgba(244,63,94,0.35)]",
    canvasDark: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(244,63,94,0.12)_0%,transparent_60%),linear-gradient(180deg,#14070a_0%,#200c12_50%,#0a0305_100%)]",
    canvasLight: "bg-[radial-gradient(120%_90%_at_50%_0%,rgba(255,228,230,0.7)_0%,transparent_60%),linear-gradient(180deg,#fff1f2_0%,#ffe4e6_50%,#ffffff_100%)]",
    activeNavClass: "bg-rose-600 text-white shadow-md shadow-rose-600/30",
    sendBtnClass: "bg-gradient-to-tr from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-md shadow-rose-600/30",
    waveActiveColor: "#fb7185",
    waveInactiveColor: "rgba(251, 113, 133, 0.25)",
  },
};

export const DEFAULT_PALETTE: PaletteKey = "violet";

export function getStoredPalette(): PaletteKey {
  if (typeof window === "undefined") return DEFAULT_PALETTE;
  const saved = localStorage.getItem("chatapp-palette");
  if (saved && saved in LUXURY_PALETTES) return saved as PaletteKey;
  return DEFAULT_PALETTE;
}
