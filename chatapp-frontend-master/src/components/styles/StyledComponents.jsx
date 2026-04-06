import { Paper, Skeleton, alpha, keyframes, styled } from "@mui/material";
import { Link as LinkComponent } from "react-router-dom";
import { uiTokens } from "../../design-system/tokens";

const VisuallyHiddenInput = styled("input")({
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
});

const Link = styled(LinkComponent)(({ theme }) => ({
  textDecoration: "none",
  color: "inherit",
  padding: "0.35rem 0.75rem",
  borderRadius: "0.75rem",
  transition: "background-color 0.2s ease, transform 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    transform: "translateY(-1px)",
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: uiTokens.shadows.focus,
  },
}));

const InputBox = styled("input")(({ theme }) => ({
  width: "100%",
  height: "100%",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  outline: "none",
  padding: "0 3rem",
  borderRadius: "999px",
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "inset 0 1px 2px rgba(10, 15, 31, 0.08)",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  "&::placeholder": {
    color: alpha(theme.palette.text.primary, 0.52),
  },
  "&:focus": {
    borderColor: alpha(theme.palette.primary.main, 0.58),
    boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.18)}`,
  },
}));

const SearchField = styled("input")(({ theme }) => ({
  padding: "0.9rem 1.4rem",
  width: "20vmax",
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  outline: "none",
  borderRadius: "999px",
  backgroundColor: alpha(theme.palette.background.paper, 0.96),
  fontSize: "1rem",
  color: theme.palette.text.primary,
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  "&:focus": {
    borderColor: alpha(theme.palette.primary.main, 0.55),
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.16)}`,
  },
}));

const CurveButton = styled("button")(({ theme }) => ({
  borderRadius: "999px",
  padding: "0.9rem 1.8rem",
  border: "none",
  outline: "none",
  cursor: "pointer",
  background: uiTokens.gradients.brand,
  color: theme.palette.primary.contrastText,
  fontSize: "1rem",
  fontWeight: 600,
  boxShadow: uiTokens.shadows.cta,
  transition: "transform 0.2s ease, filter 0.2s ease",
  "&:hover": {
    transform: "translateY(-1px)",
    filter: "brightness(1.04)",
  },
  "&:focus-visible": {
    boxShadow: `${uiTokens.shadows.focus}, ${uiTokens.shadows.cta}`,
  },
}));

const GlassCard = styled(Paper)(() => ({
  background: "linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
  boxShadow: uiTokens.shadows.elevated,
}));

const bounceYAnimation = keyframes`
0%, 100% { transform: translateY(0px); opacity: 0.75; }
50% { transform: translateY(-8px); opacity: 1; }
`;

const BouncingSkeleton = styled(Skeleton)(({ theme }) => ({
  animation: `${bounceYAnimation} 1s infinite ease-in-out`,
  backgroundColor: alpha(theme.palette.primary.main, 0.3),
}));

export {
  CurveButton,
  SearchField,
  InputBox,
  Link,
  VisuallyHiddenInput,
  BouncingSkeleton,
  GlassCard,
};
