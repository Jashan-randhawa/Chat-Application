import { Paper, Skeleton, keyframes, styled } from "@mui/material";
import { Link as LinkComponent } from "react-router-dom";
import {
  brandGradient,
  coolWhite,
  glassStroke,
  strongText,
} from "../../constants/color";

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
  padding: 0.35rem 0.75rem;
  border-radius: 0.75rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  &:hover {
    background-color: rgba(108, 99, 255, 0.12);
    transform: translateY(-1px);
  }
`;

const InputBox = styled("input")`
  width: 100%;
  height: 100%;
  border: 1px solid rgba(108, 99, 255, 0.14);
  outline: none;
  padding: 0 3rem;
  border-radius: 999px;
  background-color: ${coolWhite};
  color: ${strongText};
  box-shadow: inset 0 1px 2px rgba(10, 15, 31, 0.08);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &::placeholder {
    color: rgba(30, 36, 56, 0.5);
  }
  &:focus {
    border-color: rgba(108, 99, 255, 0.55);
    box-shadow: 0 0 0 4px rgba(108, 99, 255, 0.18);
  }
`;

const SearchField = styled("input")`
  padding: 0.9rem 1.4rem;
  width: 20vmax;
  border: 1px solid rgba(108, 99, 255, 0.2);
  outline: none;
  border-radius: 999px;
  background-color: rgba(245, 248, 255, 0.96);
  font-size: 1rem;
  color: ${strongText};
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  &:focus {
    border-color: rgba(108, 99, 255, 0.55);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.16);
  }
`;

const CurveButton = styled("button")`
  border-radius: 999px;
  padding: 0.9rem 1.8rem;
  border: none;
  outline: none;
  cursor: pointer;
  background: ${brandGradient};
  color: white;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 10px 24px rgba(17, 26, 52, 0.35);
  transition: transform 0.2s ease, filter 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.04);
  }
`;

const GlassCard = styled(Paper)(() => ({
  background: "linear-gradient(145deg, rgba(255,255,255,0.16), rgba(255,255,255,0.07))",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${glassStroke}`,
  borderRadius: "1rem",
  boxShadow: "0 12px 30px rgba(10,15,31,0.3)",
}));

const bounceYAnimation = keyframes`
0%, 100% { transform: translateY(0px); opacity: 0.75; }
50% { transform: translateY(-8px); opacity: 1; }
`;

const BouncingSkeleton = styled(Skeleton)(() => ({
  animation: `${bounceYAnimation} 1s infinite ease-in-out`,
  backgroundColor: "rgba(108, 99, 255, 0.3)",
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
