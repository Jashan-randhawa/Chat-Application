import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetUsers, adminDeleteUser } from "@/services/api";
import { transformImage, formatDate } from "@/lib/features";
import { Loader2, Search, Users, UserCircle, Trash2, ShieldAlert, Circle, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  bio?: string;
  avatar: string;
  friends: number;
  groups: number;
  messagesCount?: number;
  isOnline?: boolean;
  createdAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = () => {
    adminGetUsers()
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to permanently delete user @${user.username} (${user.name})? This will remove all their direct chats, friendships, and status stories.`)) {
      return;
    }
    setDeletingId(user._id);
    try {
      await adminDeleteUser(user._id);
      toast.success(`User @${user.username} deleted successfully`);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      (u.bio && u.bio.toLowerCase().includes(query.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Users Directory</h1>
          <p className="text-xs text-white/40 mt-0.5">
            {users.length} registered users · {users.filter((u) => u.isOnline).length} active now
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, @username, or bio..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 placeholder:text-white/25 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Bio / Status</span>
          <span className="col-span-1 text-center">Friends</span>
          <span className="col-span-1 text-center">Groups</span>
          <span className="col-span-1 text-center">Messages</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <Users className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No users found</p>
          </div>
        ) : (
          filtered.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
            >
              {/* User Avatar, Name & Online Status */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                  {u.avatar ? (
                    <img src={transformImage(u.avatar, 50)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-9 h-9 text-white/20" />
                  )}
                  {u.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#161b22]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-white truncate">{u.name}</span>
                    {u.isOnline && (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">Live</span>
                    )}
                  </div>
                  <span className="text-xs text-white/40 truncate block">@{u.username}</span>
                </div>
              </div>

              {/* Bio & Member since */}
              <div className="col-span-3 min-w-0">
                <p className="text-xs text-white/70 truncate">{u.bio || "No bio set"}</p>
                {u.createdAt && (
                  <p className="text-[10px] text-white/30 truncate mt-0.5">Joined {formatDate(u.createdAt)}</p>
                )}
              </div>

              {/* Friends count */}
              <div className="col-span-1 text-center">
                <span className="inline-block bg-sky-500/10 text-sky-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {u.friends}
                </span>
              </div>

              {/* Groups count */}
              <div className="col-span-1 text-center">
                <span className="inline-block bg-violet-500/10 text-violet-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {u.groups}
                </span>
              </div>

              {/* Messages count */}
              <div className="col-span-1 text-center">
                <span className="inline-block bg-amber-500/10 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {u.messagesCount ?? 0}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDeleteUser(u)}
                  disabled={deletingId === u._id}
                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                  title="Delete user"
                >
                  {deletingId === u._id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
