import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import { MessageSquare, ArrowLeft, Compass } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.emerald;

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Ambient gradient */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br ${activeTheme.primary} opacity-20 blur-3xl pointer-events-none`} />
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-tl ${activeTheme.primary} opacity-15 blur-3xl pointer-events-none`} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-border/70 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center">
          <div className="relative mb-5">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${activeTheme.primary} flex items-center justify-center shadow-xl text-white`}>
              <Compass className="w-10 h-10 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-xs">
              404
            </span>
          </div>

          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            Page Not Found
          </h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
            The page you're looking for ({location.pathname}) doesn't exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
            <button
              onClick={() => navigate("/")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-semibold bg-gradient-to-r ${activeTheme.primary} shadow-md hover:opacity-90 transition-opacity cursor-pointer`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Back to Chats</span>
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold bg-accent/60 hover:bg-accent text-foreground border border-border/50 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
