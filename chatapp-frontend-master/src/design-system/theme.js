import { createTheme } from "@mui/material/styles";
import { darkPalette, lightPalette, uiTokens } from "./tokens";

const getThemeOptions = (palette) => ({
  palette,
  spacing: 8,
  shape: {
    borderRadius: uiTokens.radius.md,
  },
  typography: {
    fontFamily: uiTokens.typography.fontFamily,
    h1: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 700 },
    h2: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 700 },
    h3: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 700 },
    h4: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 700 },
    h5: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 600 },
    h6: { fontFamily: uiTokens.typography.headingFamily, fontWeight: 600 },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "rgba(99,102,241,0.28) transparent",
        },
        "*": {
          boxSizing: "border-box",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: uiTokens.radius.full,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:focus-visible": {
            boxShadow: uiTokens.shadows.focus,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: uiTokens.radius.lg,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: uiTokens.radius.lg,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            boxShadow: uiTokens.shadows.focus,
          },
        },
      },
    },
  },
});

export const appTheme = createTheme(getThemeOptions(lightPalette));
export const appDarkTheme = createTheme(getThemeOptions(darkPalette));
