import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { adminLogout, getAdmin } from "@/services/api";
import {
  LayoutDashboard, Users, MessageSquare, MessagesSquare,
  LogOut, ArrowLeft, Shield, Menu, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard",  path: "/admin/dashboard", icon: LayoutDashboard, color: "text-emerald-400" },
  { label: "Users",      path: "/admin/users",     icon: Users,           color: "text-sky-400"     },
  { label: "Chats",      path: "/admin/chats",     icon: MessagesSquare,  color: "text-violet-400"  },
  { label: "Messages",   path: "/admin/messages",  icon: MessageSquare,   color: "text-amber-400"   },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, setIsAdmin } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    getAdmin()
      .then(() => setIsAdmin(true))
      .catch(() => { setIsAdmin(false); navigate("/admin"); });
  }, []);

  const handleLogout = async () => {
    try { await adminLogout(); toast.success("Logged out"); } catch {}
    setIsAdmin(false);
    navigate("/admin");
  };

  if (!isAdmin) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-none">Admin Panel</p>
            <p className="text-[10px] text-white/40 mt-0.5">Control Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">Navigation</p>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 relative",
                active ? "text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              {active && (
                <motion.div layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <item.icon className={cn("w-4 h-4 flex-shrink-0 relative z-10", active ? item.color : "")} />
              <span className="relative z-10 font-medium">{item.label}</span>
              {active && <ChevronRight className={cn("w-3.5 h-3.5 ml-auto relative z-10", item.color)} />}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-0.5">
        <button onClick={() => navigate("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" /><span>Back to App</span>
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-4 h-4" /><span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#0d1117] overflow-hidden text-white">
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-[#161b22] border-r border-white/5">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-56 bg-[#161b22] border-r border-white/5 md:hidden">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#161b22]">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/60">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
