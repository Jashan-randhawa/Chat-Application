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

export default function PaletteSwitcher(_props: Props) {
  // Palette options removed as requested; app defaults to Imperial Emerald
  return null;
}
