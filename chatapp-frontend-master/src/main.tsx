import { createRoot } from "react-dom/client";
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

injectSpeedInsights();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
