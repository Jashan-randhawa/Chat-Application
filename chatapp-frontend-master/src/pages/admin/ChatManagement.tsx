import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetChats, adminDeleteChat } from "@/services/api";
import { formatDate } from "@/lib/features";
import { Loader2, Search, MessagesSquare, Users, MessageCircle, Calendar, Trash2, Eye, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AdminChat {
  _id: string;
  name: string;
  avatar: string[];
  groupChat: boolean;
  totalMembers: number;
  totalMessages: number;
  members: { _id: string; name: string; username?: string; avatar: string }[];
  creator?: { name: string; username?: string; avatar: string };
  createdAt?: string;
  updatedAt?: string;
}

export default function ChatManagement() {
  const [chats, setChats] = useState<AdminChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "direct" | "group">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);

  useEffect(() => {
    adminGetChats()
      .then(({ data }) => setChats(data.chats || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteChat = async (chat: AdminChat) => {
    if (
      !confirm(
        `Are you sure you want to delete "${chat.name}"? All ${chat.totalMessages} messages and attachments in this chat will be permanently deleted.`
      )
    ) {
      return;
    }
    setDeletingId(chat._id);
    try {
      await adminDeleteChat(chat._id);
      toast.success(`Chat "${chat.name}" deleted successfully`);
      setChats((prev) => prev.filter((c) => c._id !== chat._id));
      if (selectedChat?._id === chat._id) setSelectedChat(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete chat");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = chats.filter((c) => {
    const matchQ =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.creator?.name && c.creator.name.toLowerCase().includes(query.toLowerCase())) ||
      (c.creator?.username && c.creator.username.toLowerCase().includes(query.toLowerCase()));
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
          <h1 className="text-xl font-bold text-white">Chats Directory</h1>
          <p className="text-xs text-white/40 mt-0.5">{chats.length} total channels monitored</p>
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
              placeholder="Search chats or creator..."
              className="w-48 bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-white/25 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-4">Chat Channel</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-1 text-center">Members</span>
          <span className="col-span-1 text-center">Messages</span>
          <span className="col-span-2">Created / Creator</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <MessagesSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No chats match your criteria</p>
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
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-violet-500/20 flex items-center justify-center border border-white/10">
                  {c.avatar?.[0] ? (
                    <img src={c.avatar[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-violet-300 text-xs font-bold">{c.name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-semibold text-sm text-white truncate block">{c.name}</span>
                  <span className="text-[10px] text-white/30 font-mono truncate block">ID: {c._id}</span>
                </div>
              </div>

              <div className="col-span-2">
                {c.groupChat ? (
                  <span className="inline-flex items-center gap-1 bg-violet-500/10 text-violet-400 text-xs font-medium px-2 py-0.5 rounded-full border border-violet-500/20">
                    <Users className="w-2.5 h-2.5" /> Group
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-sky-500/10 text-sky-400 text-xs font-medium px-2 py-0.5 rounded-full border border-sky-500/20">
                    <MessageCircle className="w-2.5 h-2.5" /> Direct
                  </span>
                )}
              </div>

              <div className="col-span-1 text-center">
                <button
                  onClick={() => setSelectedChat(c)}
                  className="text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                  title="View members"
                >
                  <Users className="w-3 h-3 text-violet-400" />
                  {c.totalMembers}
                </button>
              </div>

              <div className="col-span-1 text-center">
                <span className="text-xs font-mono font-medium text-amber-400/90">{c.totalMessages}</span>
              </div>

              <div className="col-span-2">
                <span className="text-xs text-white/80 font-medium truncate block">{c.creator?.name || "—"}</span>
                {c.creator?.username && (
                  <span className="text-[10px] text-white/30 truncate block">@{c.creator.username}</span>
                )}
                {c.createdAt && (
                  <span className="text-[10px] text-white/25 truncate block mt-0.5">{formatDate(c.createdAt)}</span>
                )}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-1">
                <button
                  onClick={() => setSelectedChat(c)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Inspect channel members"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteChat(c)}
                  disabled={deletingId === c._id}
                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  title="Permanently delete chat"
                >
                  {deletingId === c._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Inspect Chat Members Modal */}
      <Dialog open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <DialogContent className="bg-[#161b22] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-400" />
              {selectedChat?.name}
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              {selectedChat?.groupChat ? "Group Conversation" : "Direct Conversation"} • {selectedChat?.totalMembers} Participants
            </p>
          </DialogHeader>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mt-2">
            {selectedChat?.members?.map((m) => {
              const isCreator = selectedChat.creator?.username && selectedChat.creator.username === m.username;
              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {m.avatar ? (
                        <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-violet-300">{m.name[0]}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">{m.name}</span>
                        {isCreator && (
                          <span className="text-[9px] bg-violet-500/20 text-violet-300 font-medium px-1.5 py-0.2 rounded-full">
                            Admin
                          </span>
                        )}
                      </div>
                      {m.username && <span className="text-[10px] text-white/35 block truncate">@{m.username}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-white/25 font-mono">ID: {m._id.slice(-6)}</span>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={() => setSelectedChat(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium text-white transition-all"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

