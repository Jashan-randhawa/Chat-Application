import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, getAdmin } from "@/services/api";
import { saveToken } from "@/lib/token";
import { useAppStore } from "@/store/appStore";
import { Shield, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminLogin() {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { isAdmin, setIsAdmin } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    getAdmin().then(() => setIsAdmin(true)).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (isAdmin) navigate("/admin/dashboard");
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await adminLogin(secretKey);
      if (data.token) saveToken(data.token);
      toast.success(data.message || "Welcome, Admin!");
      setIsAdmin(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid secret key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Card */}
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40">
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-sm text-white/40 mt-1">Enter your secret key to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type={showKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Secret Key"
                required
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder:text-white/25 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !secretKey.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl py-3 font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 group transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Panel
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <button
              onClick={() => navigate("/login")}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              ← Back to user login
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white/15 mt-4">
          Restricted area · Authorized personnel only
        </p>
      </motion.div>
    </div>
  );
}
