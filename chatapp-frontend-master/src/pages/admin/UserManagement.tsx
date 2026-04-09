import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetUsers } from "@/services/api";
import { transformImage } from "@/lib/features";
import { Loader2, Search, Users, UserCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  friends: number;
  groups: number;
}

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminGetUsers()
      .then(({ data }) => setUsers(data.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.username.toLowerCase().includes(query.toLowerCase())
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
          <h1 className="text-xl font-bold text-white">Users</h1>
          <p className="text-xs text-white/40 mt-0.5">{users.length} registered users</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 placeholder:text-white/25 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Username</span>
          <span className="col-span-3 truncate">ID</span>
          <span className="col-span-1 text-center">Friends</span>
          <span className="col-span-1 text-center">Groups</span>
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
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/10">
                  {u.avatar ? (
                    <img src={transformImage(u.avatar, 50)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-white/20" />
                  )}
                </div>
                <span className="font-medium text-sm text-white truncate">{u.name}</span>
              </div>
              <div className="col-span-3">
                <span className="text-sm text-white/40">@{u.username}</span>
              </div>
              <div className="col-span-3">
                <span className="text-xs text-white/20 font-mono truncate block">{u._id}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-block bg-sky-500/10 text-sky-400 text-xs font-semibold px-2 py-0.5 rounded-full">{u.friends}</span>
              </div>
              <div className="col-span-1 text-center">
                <span className="inline-block bg-violet-500/10 text-violet-400 text-xs font-semibold px-2 py-0.5 rounded-full">{u.groups}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
