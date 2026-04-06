# React + Vite

This project uses React with Vite for the chat frontend.

## UI Design System Conventions

- Use centralized tokens from `/home/runner/work/Chat-Application/Chat-Application/chatapp-frontend-master/src/design-system/tokens.js` as the single source of truth for colors, gradients, typography families, radius, and shadows.
- Use the centralized MUI theme from `/home/runner/work/Chat-Application/Chat-Application/chatapp-frontend-master/src/design-system/theme.js` and consume values via `useTheme()` where possible.
- Avoid introducing new hard-coded colors in pages/components when a token or `theme.palette` value exists.
- For shared reusable primitives, prefer theme-aware styles in `/home/runner/work/Chat-Application/Chat-Application/chatapp-frontend-master/src/components/styles/StyledComponents.jsx`.
- Keep interaction accessibility consistent:
  - Ensure keyboard-visible focus states (`:focus-visible`) for interactive custom elements.
  - Provide `aria-label` for icon-only buttons and key form controls.
  - Keep text/foreground colors at contrast-safe levels against their backgrounds.

## Validation

- Build: `npm run build`
- Lint: `npm run lint` (repository currently has pre-existing lint issues unrelated to these UI changes)
