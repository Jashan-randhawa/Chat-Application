// ============================================================
// REDESIGNED StyledComponents — premium chat UI aesthetics
// Changes: modern InputBox, Link hover states, CurveButton,
//          SearchField with glass morphism, animated skeleton
// ============================================================

import { Skeleton, keyframes, styled } from "@mui/material";
import { Link as LinkComponent } from "react-router-dom";
import { grayColor, matBlack } from "../../constants/color";

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

// Chat list item link — smooth hover + active transitions
const Link = styled(LinkComponent)`
  text-decoration: none;
  color: inherit;
  padding: 0;
  display: block;
  transition: background 0.15s ease;
  &:hover > div {
    background: rgba(14, 165, 233, 0.06) !important;
  }
`;

// Message input box — pill-shaped, subtle background
const InputBox = styled("input")`
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0.75rem 3.5rem 0.75rem 3.5rem;
  border-radius: 2rem;
  background-color: #f0f2f5;
  font-size: 0.95rem;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1e293b;
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    background-color: #e8edf3;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.25);
  }
`;

// Search field — clean, minimal
const SearchField = styled("input")`
  padding: 0.75rem 1.5rem;
  width: 20vmax;
  border: 1.5px solid rgba(14, 165, 233, 0.2);
  outline: none;
  border-radius: 2rem;
  background-color: rgba(240, 242, 245, 0.9);
  font-size: 1rem;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  color: #1e293b;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
  }
`;

// Primary action button — pill shape, smooth hover
const CurveButton = styled("button")`
  border-radius: 2rem;
  padding: 0.75rem 2rem;
  border: none;
  outline: none;
  cursor: pointer;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Inter', 'Segoe UI', sans-serif;
  letter-spacing: 0.01em;
  transition: opacity 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);

  &:hover {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(14, 165, 233, 0.45);
  }

  &:active {
    transform: translateY(0);
  }
`;

// Typing indicator dots — smooth pulse
const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50% { transform: translateY(-6px); opacity: 1; }
`;

const BouncingSkeleton = styled(Skeleton)(() => ({
  animation: `${bounceAnimation} 0.9s ease-in-out infinite`,
  backgroundColor: "rgba(14,165,233,0.3) !important",
  borderRadius: "50%",
}));

export {
  CurveButton,
  SearchField,
  InputBox,
  Link,
  VisuallyHiddenInput,
  BouncingSkeleton,
};
