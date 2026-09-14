import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Lock,
  User,
  Eye,
  EyeOff,
  Camera,
  ArrowRight,
  ShieldCheck,
  Zap,
  Radio,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Loader2,
  FileText,
  AlertCircle,
  Palette,
} from "lucide-react";
import { loginUser, registerUser } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import AppLogo from "@/components/common/AppLogo";

type PaletteKey = "violet" | "cobalt" | "emerald" | "rose";

interface PaletteConfig {
  name: string;
  badge: string;
  dotColor: string;
  gradientButton: string;
  textGradClass: string;
  glowBorder: string;
  logoGlow: string;
  accentText: string;
  tagClass: string;
  selectionClass: string;
  lightWash: string;
  darkWash: string;
  metricIcon1Color: string;
  metricIcon2Color: string;
  metricIcon3Color: string;
  focusRing: string;
}

const PALETTES: Record<PaletteKey, PaletteConfig> = {
  violet: {
    name: "Obsidian Iris",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
    dotColor: "bg-violet-500",
    gradientButton: "gradient-primary-violet",
    textGradClass: "text-grad-violet",
    glowBorder: "border-violet-500/35",
    logoGlow: "text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]",
    accentText: "text-violet-600 dark:text-violet-400",
    tagClass: "text-violet-800 dark:text-violet-400",
    selectionClass: "selection:bg-violet-500/20",
    lightWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(237,233,254,0.92)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(139,92,246,0.22)_0%,transparent_62%),linear-gradient(160deg,#f5f3ff_0%,#ede9fe_40%,#ddd6fe_100%)]",
    darkWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(124,58,237,0.28)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(99,102,241,0.22)_0%,transparent_62%),linear-gradient(160deg,#130e24_0%,#0e0b1a_45%,#090710_100%)]",
    metricIcon1Color: "text-violet-600 dark:text-violet-400",
    metricIcon2Color: "text-amber-500 dark:text-amber-400",
    metricIcon3Color: "text-indigo-600 dark:text-indigo-400",
    focusRing: "focus-visible:ring-violet-500",
  },
  cobalt: {
    name: "Midnight Sapphire",
    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
    dotColor: "bg-sky-500",
    gradientButton: "gradient-primary-cobalt",
    textGradClass: "text-grad-cobalt",
    glowBorder: "border-sky-500/35",
    logoGlow: "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]",
    accentText: "text-sky-600 dark:text-sky-400",
    tagClass: "text-sky-800 dark:text-sky-400",
    selectionClass: "selection:bg-sky-500/20",
    lightWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(224,242,254,0.92)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(14,165,233,0.22)_0%,transparent_62%),linear-gradient(160deg,#f0f9ff_0%,#e0f2fe_40%,#bae6fd_100%)]",
    darkWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(2,132,199,0.28)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(37,99,235,0.20)_0%,transparent_62%),linear-gradient(160deg,#0a1526_0%,#060e1c_45%,#040710_100%)]",
    metricIcon1Color: "text-sky-600 dark:text-sky-400",
    metricIcon2Color: "text-amber-500 dark:text-amber-400",
    metricIcon3Color: "text-blue-600 dark:text-blue-400",
    focusRing: "focus-visible:ring-sky-500",
  },
  emerald: {
    name: "Imperial Emerald",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    dotColor: "bg-emerald-500",
    gradientButton: "gradient-primary-emerald",
    textGradClass: "text-grad-emerald",
    glowBorder: "border-emerald-500/35",
    logoGlow: "text-emerald-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.6)]",
    accentText: "text-emerald-600 dark:text-emerald-400",
    tagClass: "text-emerald-800 dark:text-emerald-400",
    selectionClass: "selection:bg-emerald-500/20",
    lightWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(255,224,163,0.92)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(16,185,129,0.3)_0%,transparent_62%),linear-gradient(160deg,#f5ebd0_0%,#dfc495_40%,#87a094_100%)]",
    darkWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(201,147,47,0.25)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(16,185,129,0.20)_0%,transparent_62%),linear-gradient(160deg,#1c2b30_0%,#141b1e_45%,#0d1112_100%)]",
    metricIcon1Color: "text-emerald-600 dark:text-emerald-400",
    metricIcon2Color: "text-amber-500 dark:text-amber-400",
    metricIcon3Color: "text-emerald-600 dark:text-emerald-400",
    focusRing: "focus-visible:ring-emerald-500",
  },
  rose: {
    name: "Sunset Rose",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    dotColor: "bg-rose-500",
    gradientButton: "gradient-primary-rose",
    textGradClass: "text-grad-rose",
    glowBorder: "border-rose-500/35",
    logoGlow: "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]",
    accentText: "text-rose-600 dark:text-rose-400",
    tagClass: "text-rose-800 dark:text-rose-400",
    selectionClass: "selection:bg-rose-500/20",
    lightWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(255,228,230,0.95)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(244,63,94,0.22)_0%,transparent_62%),linear-gradient(160deg,#fff1f2_0%,#ffe4e6_40%,#fecdd3_100%)]",
    darkWash: "bg-[radial-gradient(110%_85%_at_12%_8%,rgba(225,29,72,0.25)_0%,transparent_52%),radial-gradient(130%_95%_at_90%_100%,rgba(245,158,11,0.20)_0%,transparent_62%),linear-gradient(160deg,#241017_0%,#1a0b10_45%,#100508_100%)]",
    metricIcon1Color: "text-rose-500 dark:text-rose-400",
    metricIcon2Color: "text-amber-500 dark:text-amber-400",
    metricIcon3Color: "text-orange-500 dark:text-orange-400",
    focusRing: "focus-visible:ring-rose-500",
  },
};

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, palette } = useAppStore();
  const activeTheme = PALETTES[palette] || PALETTES.emerald;

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please provide both username and password.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const { data } = await loginUser({ username: username.trim(), password });
      setUser(data.user, data.token);
      toast.success(data.message || "Welcome back!");
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Login failed. Please check your credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !name.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!avatarFile) {
      setError("Please upload a profile photo.");
      toast.error("Please upload a profile photo.");
      return;
    }

    setError(null);
    setIsLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    formData.append("name", name.trim());
    formData.append("bio", bio.trim());
    formData.append("username", username.trim());
    formData.append("password", password);

    try {
      const { data } = await registerUser(formData);
      setUser(data.user, data.token);
      toast.success(data.message || "Account created successfully!");
      navigate("/");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`h-screen max-h-screen h-[100dvh] max-h-[100dvh] w-full flex flex-col lg:flex-row bg-background text-foreground transition-colors duration-200 ${activeTheme.selectionClass} overflow-hidden`}>
      {/* ── Left Hero Panel (Editorial Treatment inspired by AI-Attendance-System) ── */}
      <div className="hidden lg:flex flex-[1.1] xl:flex-[1.15] h-full relative overflow-hidden flex-col justify-between p-6 lg:p-8 xl:p-10 2xl:p-12 border-r border-border/80 shrink-0 select-none">
        {/* Ambient Gradient Wash with dynamic luxury palettes */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 dark:opacity-0 ${activeTheme.lightWash}`} />
        <div className={`absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 dark:opacity-100 ${activeTheme.darkWash}`} />

        {/* Top brand header */}
        <div className="relative z-10 flex items-center justify-between shrink-0">
          <AppLogo size="lg" showWordmark={true} subtitle="Real-Time Messaging Mesh" glow={true} />

          <div className="flex items-center gap-2 px-2.5 py-1 xl:px-3 xl:py-1.5 rounded-full bg-white/50 dark:bg-slate-900/60 border border-white/60 dark:border-slate-800 text-[11px] xl:text-xs font-medium backdrop-blur-xs text-slate-700 dark:text-slate-300">
            <span className={`w-2 h-2 rounded-full ${activeTheme.dotColor} animate-pulse`} />
            <span>Operational v2.0</span>
          </div>
        </div>

        {/* Center Editorial Copy */}
        <div className="relative z-10 max-w-lg my-auto py-2 xl:py-4 shrink-0">
          <p className={`text-[11px] xl:text-xs font-semibold tracking-wider ${activeTheme.tagClass} uppercase font-sans mb-2 xl:mb-3`}>
            Encrypted Real-Time Collaboration
          </p>
          <h1 className="font-display text-2xl lg:text-3xl xl:text-4xl font-normal tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-3 xl:mb-4">
            Every conversation delivered, every connection verified with calm precision.
          </h1>
          <p className="text-xs xl:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-4 xl:mb-6">
            Sub-millisecond WebSocket channels, WebRTC peer audio/video calls, and granular channels — engineered for seamless, instantaneous human connectivity.
          </p>

          <div className="grid grid-cols-3 gap-2 xl:gap-3">
            <div className="p-2.5 xl:p-3 rounded-xl bg-white/45 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 backdrop-blur-xs">
              <Zap className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${activeTheme.metricIcon1Color} mb-1 xl:mb-1.5`} />
              <p className="text-xs font-bold text-slate-900 dark:text-white">&lt; 10ms</p>
              <p className="text-[10px] xl:text-[11px] text-slate-600 dark:text-slate-400">Socket Latency</p>
            </div>
            <div className="p-2.5 xl:p-3 rounded-xl bg-white/45 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 backdrop-blur-xs">
              <ShieldCheck className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${activeTheme.metricIcon2Color} mb-1 xl:mb-1.5`} />
              <p className="text-xs font-bold text-slate-900 dark:text-white">JWT Auth</p>
              <p className="text-[10px] xl:text-[11px] text-slate-600 dark:text-slate-400">Zero Trust Access</p>
            </div>
            <div className="p-2.5 xl:p-3 rounded-xl bg-white/45 dark:bg-slate-900/50 border border-white/60 dark:border-slate-800/80 backdrop-blur-xs">
              <Radio className={`w-3.5 h-3.5 xl:w-4 xl:h-4 ${activeTheme.metricIcon3Color} mb-1 xl:mb-1.5`} />
              <p className="text-xs font-bold text-slate-900 dark:text-white">WebRTC</p>
              <p className="text-[10px] xl:text-[11px] text-slate-600 dark:text-slate-400">P2P Audio & Calls</p>
            </div>
          </div>
        </div>

        {/* Ambient bottom wordmark */}
        <div className="relative z-0 select-none pointer-events-none mt-auto pt-2 shrink-0">
          <span className="font-display text-4xl lg:text-5xl xl:text-6xl tracking-wider leading-none text-slate-900/10 dark:text-white/5 block whitespace-nowrap overflow-hidden text-ellipsis uppercase">
            EMERALD
          </span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-8 xl:p-10 relative bg-background text-foreground transition-colors duration-200 overflow-y-auto">
        {/* Top corner utilities */}
        <div className="flex items-center justify-between w-full mb-3 lg:mb-4 shrink-0">
          <div className="lg:hidden flex items-center">
            <AppLogo size="xs" showWordmark={true} />
          </div>

          <div className="ml-auto flex items-center gap-2">

            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fit to Fullscreen Window"}
              aria-label="Toggle Fullscreen"
              className="p-2 rounded-xl border border-border/80 bg-card/80 text-foreground hover:bg-muted/40 transition-all duration-200 cursor-pointer shadow-xs min-h-[36px] min-w-[36px] flex items-center justify-center btn-tactile"
            >
              {isFullscreen ? (
                <Minimize2 className={`w-4 h-4 ${activeTheme.accentText}`} />
              ) : (
                <Maximize2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
            <ThemeToggle variant="icon" />
          </div>
        </div>

        {/* Main form container */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto space-y-3.5 lg:space-y-4 my-auto shrink-0 py-2">
          {/* Header section */}
          <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md ${activeTheme.badge} text-[11px] font-medium`}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Real-Time Messaging Gateway</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-foreground">
              {isLogin ? "Welcome back" : "Create your identity"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-sans">
              {isLogin
                ? "Sign in with your credentials to resume your active conversations."
                : "Join the network to collaborate in real-time channels and group hubs."}
            </p>
          </div>

          {/* Mode Segmented Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/80">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError(null);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isLogin
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError(null);
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                !isLogin
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="py-2 rounded-xl animate-enter-subtle">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              onSubmit={isLogin ? handleLogin : handleSignup}
              className="space-y-3"
            >
              {!isLogin && (
                <>
                  {/* Avatar upload */}
                  <div className="flex justify-center py-1">
                    <label className="relative cursor-pointer group">
                      <div className="w-20 h-20 rounded-2xl bg-card border-2 border-dashed border-border group-hover:border-foreground/50 transition-colors flex items-center justify-center overflow-hidden shadow-xs">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-muted-foreground group-hover:text-foreground transition-colors">
                            <Camera className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-medium">Add Photo</span>
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${activeTheme.dotColor} text-white flex items-center justify-center shadow-md`}>
                        <Camera className="w-3 h-3" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`pl-9 h-10 rounded-xl bg-card border-border/80 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/60 ${activeTheme.focusRing}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                      Bio <span className="lowercase text-[10px] opacity-70">(optional)</span>
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Software engineer & tech enthusiast"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className={`pl-9 h-10 rounded-xl bg-card border-border/80 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/60 ${activeTheme.focusRing}`}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type="text"
                    autoFocus={isLogin}
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`pl-9 h-10 rounded-xl bg-card border-border/80 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/60 ${activeTheme.focusRing}`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-9 pr-9 h-10 rounded-xl bg-card border-border/80 text-foreground text-xs sm:text-sm placeholder:text-muted-foreground/60 ${activeTheme.focusRing}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-10 ${activeTheme.gradientButton} text-white font-medium rounded-xl shadow-xs btn-tactile text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isLogin ? "Authenticating..." : "Creating Account..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? "Sign In to Emerald" : "Complete Registration"}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          {/* Quick Admin Callout / Preset */}
          <div className="p-2.5 sm:p-3 rounded-xl border border-border/70 bg-card/60 text-[11px] sm:text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTheme.accentText}`} />
              Administrative Access?
            </span>
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className={`text-xs font-semibold ${activeTheme.accentText} hover:underline flex items-center gap-1 cursor-pointer`}
            >
              Admin Portal <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Bottom security assurance */}
        <div className="mt-3 lg:mt-4 text-center text-[11px] text-muted-foreground shrink-0">
          Protected by per-user cryptographic JWT authentication &amp; Socket.io encrypted transport
        </div>
      </div>
    </div>
  );
}


