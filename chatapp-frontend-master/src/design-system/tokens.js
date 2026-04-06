const colorTokens = {
  primary: {
    main: "#6366f1",
    light: "#818cf8",
    dark: "#4f46e5",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#22c1c3",
    light: "#52d4d6",
    dark: "#1a9da0",
    contrastText: "#ffffff",
  },
  accent: {
    main: "#8b7bff",
    light: "#a89cff",
    dark: "#6f61d9",
  },
  neutral: {
    0: "#ffffff",
    50: "#f8f9ff",
    100: "#f1f4ff",
    200: "#e3e8f7",
    300: "#ced5eb",
    400: "#9da7c3",
    500: "#6f7895",
    600: "#4f5874",
    700: "#343b53",
    800: "#1f2438",
    900: "#0a0f1f",
  },
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  online: "#22c1c3",
  offline: "#9da7c3",
  surfaces: {
    sidebar: "#0a0f1f",
    sidebarLight: "#111a34",
    profilePanel: "#0d142b",
  },
};

export const uiTokens = {
  colors: colorTokens,
  gradients: {
    brand: `linear-gradient(135deg, ${colorTokens.primary.main} 0%, ${colorTokens.accent.main} 45%, ${colorTokens.secondary.main} 100%)`,
    page: `linear-gradient(155deg, ${colorTokens.neutral[900]} 0%, ${colorTokens.surfaces.sidebarLight} 55%, #1a2447 100%)`,
  },
  typography: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingFamily: "Sora, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 999,
  },
  shadows: {
    card: "0 10px 24px rgba(17, 26, 52, 0.14)",
    elevated: "0 12px 30px rgba(10, 15, 31, 0.3)",
    cta: "0 10px 24px rgba(17, 26, 52, 0.35)",
    focus: "0 0 0 3px rgba(99, 102, 241, 0.24)",
  },
  zIndex: {
    mobileNavToggle: 1200,
  },
};

export const lightPalette = {
  mode: "light",
  primary: uiTokens.colors.primary,
  secondary: uiTokens.colors.secondary,
  error: { main: uiTokens.colors.error },
  warning: { main: uiTokens.colors.warning },
  info: { main: uiTokens.colors.info },
  success: { main: uiTokens.colors.success },
  text: {
    primary: uiTokens.colors.neutral[800],
    secondary: uiTokens.colors.neutral[600],
  },
  background: {
    default: uiTokens.colors.neutral[50],
    paper: uiTokens.colors.neutral[0],
  },
  divider: "rgba(17,26,52,0.08)",
};

export const darkPalette = {
  mode: "dark",
  primary: uiTokens.colors.primary,
  secondary: uiTokens.colors.secondary,
  error: { main: "#f87171" },
  warning: { main: "#fbbf24" },
  info: { main: "#60a5fa" },
  success: { main: "#34d399" },
  text: {
    primary: "#eff3ff",
    secondary: "rgba(239,243,255,0.78)",
  },
  background: {
    default: uiTokens.colors.neutral[900],
    paper: uiTokens.colors.surfaces.sidebarLight,
  },
  divider: "rgba(255,255,255,0.12)",
};
