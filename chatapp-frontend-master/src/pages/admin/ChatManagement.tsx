import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetChats } from "@/services/api";
import { Loader2, Search, MessagesSquare, Users, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface AdminChat {
  _id: string;
  name: string;
  avatar: string[];
  groupChat: boolean;
  totalMembers: number;
  totalMessages: number;
  members: { _id: string; avatar: string }[];
  creator?: { name: string; avatar: string };
}

export default function ChatManagement() {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "direct" | "group">("all");

  useEffect(() => {
    adminGetChats()
      .then(({ data }) => setChats(data.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = chats.filter((c) => {
    const matchQ = c.name.toLowerCase().includes(query.toLowerCase());
    const matchF = filter === "all" || (filter === "group" ? c.groupChat : !c.groupChat);
    return matchQ && matchF;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <p className="text-xs text-white/40 mt-0.5">{chats.length} total chats</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
            {(["all", "direct", "group"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  filter === f ? "bg-white/10 text-white font-medium" : "text-white/30 hover:text-white/60"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-44 bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-white/25 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-4">Chat</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2 text-center">Members</span>
          <span className="col-span-2 text-center">Messages</span>
          <span className="col-span-2">Creator</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <MessagesSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No chats found</p>
          </div>
        ) : (
          filtered.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-violet-500/20 flex items-center justify-center">
                  {c.avatar?.[0] ? (
                    <img src={c.avatar[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-violet-300 text-xs font-bold">{c.name[0]}</span>
                  )}
                </div>
                <span className="font-medium text-sm text-white truncate">{c.name}</span>
              </div>
              <div className="col-span-2">
                {c.groupChat ? (
                  <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    <Users className="w-2.5 h-2.5" /> Group
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    <MessageCircle className="w-2.5 h-2.5" /> Direct
                  </span>
                )}
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-white/60">{c.totalMembers}</span>
              </div>
              <div className="col-span-2 text-center">
                <span className="text-sm text-white/60">{c.totalMessages}</span>
              </div>
              <div className="col-span-2">
                <span className="text-sm text-white/40 truncate block">{c.creator?.name || "—"}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
