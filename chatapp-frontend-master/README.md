# Vibe Chat Frontend

React + Vite frontend for Vibe Chat.

## Requirements

- Node.js 18+ (recommended: 20)
- npm

## Setup

1. Install dependencies:

```bash
npm ci
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Configure environment variables:

```env
VITE_SERVER=http://localhost:3000
```

4. Start development server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - Start Vite dev server
- `npm run lint` - Run ESLint
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

## PWA

- Manifest: `public/manifest.json`
- Service worker: `public/sw.js` (registered in production from `src/main.jsx`)

## Deployment

### Vercel

1. Set project root to `chatapp-frontend-master`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable:
   - `VITE_SERVER` = backend API URL

### Notes

- Ensure SPA fallback does not override static assets.
- Keep API URL in `VITE_SERVER` pointed to your deployed backend.
