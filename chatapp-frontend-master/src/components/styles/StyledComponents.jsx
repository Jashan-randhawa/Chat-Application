import { Skeleton, keyframes, styled } from "@mui/material";
import { Link as LinkComponent } from "react-router-dom";

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

const Link = styled(LinkComponent)`
  text-decoration: none;
  color: inherit;
  padding: 0;
  display: block;
  &:hover > div {
    background: #f5f6f6 !important;
  }
`;

const InputBox = styled("input")`
  width: 100%;
  border: none;
  outline: none;
  background-color: transparent;
  /* 16px minimum on mobile prevents iOS auto-zoom on focus */
  font-size: 16px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #111b21;
  &::placeholder {
    color: #8696a0;
  }
  @media (min-width: 600px) {
    font-size: 0.9375rem;
  }
`;

const SearchField = styled("input")`
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  /* 16px minimum on mobile prevents iOS auto-zoom on focus */
  font-size: 16px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  color: #111b21;
  &::placeholder {
    color: #8696a0;
  }
  @media (min-width: 600px) {
    font-size: 0.9rem;
  }
`;

const CurveButton = styled("button")`
  border-radius: 0.5rem;
  padding: 0.75rem 2rem;
  border: none;
  outline: none;
  cursor: pointer;
  background: #00a884;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Segoe UI', system-ui, sans-serif;
  transition: background 0.2s ease;
  /* Minimum 44px tap target on mobile */
  min-height: 44px;
  touch-action: manipulation;
  &:hover { background: #008069; }
`;

const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-5px); opacity: 1; }
`;

const BouncingSkeleton = styled(Skeleton)(() => ({
  animation: `${bounceAnimation} 1s ease-in-out infinite`,
  backgroundColor: "rgba(0,168,132,0.4) !important",
  borderRadius: "50%",
}));

export { CurveButton, SearchField, InputBox, Link, VisuallyHiddenInput, BouncingSkeleton };
