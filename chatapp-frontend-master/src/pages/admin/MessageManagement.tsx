import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetMessages } from "@/services/api";
import { formatDate } from "@/lib/features";
import { Loader2, Search, MessageSquare, Paperclip, Image, Video, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface AdminMessage {
  _id: string;
  content: string;
  attachments: { url: string }[];
  sender: { name: string; avatar: string };
  chat: string;
  groupChat: boolean;
  createdAt: string;
}

function AttachmentIcon({ url }: { url: string }) {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "webm"].includes(ext)) return <Video className="w-3 h-3" />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <Image className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
}

export default function MessageManagement() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    adminGetMessages()
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = messages.filter(
    (m) =>
      m.sender.name.toLowerCase().includes(query.toLowerCase()) ||
      m.content.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Messages</h1>
          <p className="text-xs text-white/40 mt-0.5">{messages.length} total messages</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-white/25 transition-all"
          />
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-3">Sender</span>
          <span className="col-span-5">Content</span>
          <span className="col-span-2 text-center">Attachments</span>
          <span className="col-span-2">Time</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No messages found</p>
          </div>
        ) : (
          filtered.map((m, i) => (
            <motion.div
              key={m._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.015 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/[0.02] transition-colors"
            >
              {/* Sender */}
              <div className="col-span-3 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-amber-500/20 flex items-center justify-center">
                  {m.sender.avatar ? (
                    <img src={m.sender.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-300 text-[10px] font-bold">{m.sender.name[0]}</span>
                  )}
                </div>
                <span className="text-sm text-white/70 truncate font-medium">{m.sender.name}</span>
              </div>

              {/* Content */}
              <div className="col-span-5">
                {m.content ? (
                  <p className="text-sm text-white/50 truncate">{m.content}</p>
                ) : (
                  <span className="text-xs text-white/20 italic">Media only</span>
                )}
              </div>

              {/* Attachments */}
              <div className="col-span-2 flex items-center justify-center gap-1">
                {m.attachments?.length > 0 ? (
                  <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                    <AttachmentIcon url={m.attachments[0].url} />
                    {m.attachments.length}
                  </span>
                ) : (
                  <span className="text-white/15 text-xs">—</span>
                )}
              </div>

              {/* Time */}
              <div className="col-span-2">
                <span className="text-xs text-white/30">{formatDate(m.createdAt)}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
