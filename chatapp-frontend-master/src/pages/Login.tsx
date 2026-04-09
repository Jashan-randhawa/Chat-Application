import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Eye, EyeOff, User, Lock, FileText, ArrowRight, Camera } from "lucide-react";
import { loginUser, registerUser } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { toast } from "sonner";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await loginUser({ username, password });
      setUser(data.user, data.token);
      toast.success(data.message || "Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) { toast.error("Please upload an avatar"); return; }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    formData.append("name", name);
    formData.append("bio", bio);
    formData.append("username", username);
    formData.append("password", password);
    try {
      const { data } = await registerUser(formData);
      setUser(data.user, data.token);
      toast.success(data.message || "Account created!");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Branding panel */}
      <div className="relative md:w-1/2 bg-primary px-6 py-12 md:py-0 md:px-12 flex flex-col justify-center items-center text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-2 border-current" />
          <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full border border-current" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-current opacity-10" />
        </div>
        <div className="relative z-10 text-center md:text-left max-w-md">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight">ChatApp</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-3">
            Connect with anyone,<br />anywhere
          </h1>
          <p className="text-primary-foreground/70 text-sm md:text-base leading-relaxed">
            Real-time messaging with group chats, voice calls, file sharing, and more.
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 md:py-0 bg-background">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold mb-1">
                {isLogin ? "Welcome back" : "Create account"}
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                {isLogin ? "Sign in to continue chatting" : "Join the conversation today"}
              </p>

              <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
                {!isLogin && (
                  <>
                    {/* Avatar upload */}
                    <div className="flex justify-center">
                      <label className="relative cursor-pointer group">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-colors">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-8 h-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Camera className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>
                    <InputField icon={<User className="w-4 h-4" />} placeholder="Full name" value={name} onChange={setName} required />
                    <InputField icon={<FileText className="w-4 h-4" />} placeholder="Bio (optional)" value={bio} onChange={setBio} />
                  </>
                )}
                <InputField icon={<User className="w-4 h-4" />} placeholder="Username" value={username} onChange={setUsername} required />
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-muted rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  {!isLoading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
              {isLogin && (
                <p className="text-center text-xs text-muted-foreground mt-4">
                  <button onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-primary transition-colors">
                    Admin Login →
                  </button>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, placeholder, value, onChange, required }: {
  icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} required={required}
        className="w-full bg-muted rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground transition-shadow"
      />
    </div>
  );
}
