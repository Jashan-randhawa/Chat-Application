import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useAppStore } from "@/store/appStore";
import { SocketProvider } from "@/context/SocketContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Groups from "./pages/Groups";
import AdminLoginPage from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import ChatManagement from "./pages/admin/ChatManagement";
import MessageManagement from "./pages/admin/MessageManagement";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loader } = useAppStore();

  // Only block on loader if there's no cached user
  // If we have a user already, show the page immediately
  if (loader && !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loader } = useAppStore();

  if (loader && !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { fetchUser } = useAppStore();

  useEffect(() => {
    // Validate token with server in background
    // Won't redirect unless token is actually invalid
    fetchUser();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SocketProvider><Index /></SocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <SocketProvider><Groups /></SocketProvider>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute><Login /></PublicRoute>
          }
        />
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/chats" element={<ChatManagement />} />
        <Route path="/admin/messages" element={<MessageManagement />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <>
    <Toaster />
    <AppContent />
    <Analytics />
  </>
);

export default App;
