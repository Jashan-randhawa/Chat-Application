import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetMessages } from "@/services/api";
import { formatDate } from "@/lib/features";
import { parseReplyMessage } from "@/lib/replyUtils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Search, MessageSquare, Paperclip, Image, Video, FileText, Trash2, Filter, Eye, MessageCircle, ExternalLink, Calendar, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AdminMessage {
  _id: string;
  content: string;
  attachments: { url: string }[];
  sender: { _id?: string; name: string; username?: string; avatar: string };
  chat: string;
  chatName?: string;
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    adminGetMessages()
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteMessage = async (msg: AdminMessage) => {
    if (!confirm("Are you sure you want to delete this message and its associated attachments permanently?")) {
      return;
    }
    setDeletingId(msg._id);
    try {
      await adminDeleteMessage(msg._id);
      toast.success("Message deleted successfully");
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [filter, setFilter] = useState<"all" | "media" | "text">("all");

  const filtered = messages.filter((m) => {
    const matchQ =
      m.sender.name.toLowerCase().includes(query.toLowerCase()) ||
      (m.sender.username && m.sender.username.toLowerCase().includes(query.toLowerCase())) ||
      m.content.toLowerCase().includes(query.toLowerCase()) ||
      (m.chatName && m.chatName.toLowerCase().includes(query.toLowerCase()));

    const matchF =
      filter === "all" ||
      (filter === "media" ? m.attachments && m.attachments.length > 0 : !m.attachments || m.attachments.length === 0);

    return matchQ && matchF;
  });

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
          <h1 className="text-xl font-bold text-white">Messages Log</h1>
          <p className="text-xs text-white/40 mt-0.5">{messages.length} total messages recorded in database</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter pills */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs">
            {(["all", "text", "media"] as const).map((f) => (
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

          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sender, content, chat..."
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-white/25 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-3">Sender</span>
          <span className="col-span-4">Content / Context</span>
          <span className="col-span-2 text-center">Attachments</span>
          <span className="col-span-2">Time</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No messages match your query</p>
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
              <div className="col-span-3 flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-amber-500/20 flex items-center justify-center border border-white/10">
                  {m.sender.avatar ? (
                    <img src={m.sender.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-300 text-xs font-bold">{m.sender.name[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-white/90 truncate font-semibold block">{m.sender.name}</span>
                  {m.sender.username && (
                    <span className="text-[10px] text-white/40 truncate block">@{m.sender.username}</span>
                  )}
                </div>
              </div>

              {/* Content and Chat name */}
              <div className="col-span-4 min-w-0 cursor-pointer" onClick={() => setSelectedMessage(m)}>
                {m.content ? (
                  <p className="text-sm text-white/80 truncate hover:text-white transition-colors">
                    {parseReplyMessage(m.content).cleanContent || m.content}
                  </p>
                ) : (
                  <span className="text-xs text-white/25 italic">Media only</span>
                )}
                {m.chatName && (
                  <p className="text-[10px] text-white/35 truncate mt-0.5">
                    {m.groupChat ? "Group: " : "Direct: "}
                    <span className="text-white/50">{m.chatName}</span>
                  </p>
                )}
              </div>

              {/* Attachments */}
              <div className="col-span-2 flex items-center justify-center gap-1.5">
                {m.attachments?.length > 0 ? (
                  <button
                    onClick={() => setSelectedMessage(m)}
                    className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <AttachmentIcon url={m.attachments[0].url} />
                    <span>{m.attachments.length} file{m.attachments.length > 1 ? "s" : ""}</span>
                  </button>
                ) : (
                  <span className="text-white/15 text-xs">—</span>
                )}
              </div>

              {/* Time */}
              <div className="col-span-2">
                <span className="text-xs text-white/40 font-mono">{formatDate(m.createdAt)}</span>
              </div>

              {/* Action delete & inspect */}
              <div className="col-span-1 flex items-center justify-end gap-1">
                <button
                  onClick={() => setSelectedMessage(m)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Inspect message payload"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteMessage(m)}
                  disabled={deletingId === m._id}
                  className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                  title="Delete message"
                >
                  {deletingId === m._id ? (
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

      {/* Inspect Message Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="bg-[#161b22] border-white/10 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Message Payload Details
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              Sent by {selectedMessage?.sender.name} ({selectedMessage?.sender.username ? `@${selectedMessage.sender.username}` : "No username"}) on{" "}
              {selectedMessage?.createdAt ? formatDate(selectedMessage.createdAt) : "—"}
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Context details */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white/[0.03] p-3 rounded-xl border border-white/5">
              <div>
                <span className="text-white/30 block mb-0.5">Message ID</span>
                <span className="font-mono text-white/70">{selectedMessage?._id}</span>
              </div>
              <div>
                <span className="text-white/30 block mb-0.5">Target Channel</span>
                <span className="text-white/80 font-medium">
                  {selectedMessage?.chatName || "Unknown"} ({selectedMessage?.groupChat ? "Group" : "Direct"})
                </span>
              </div>
            </div>

            {/* Content text */}
            <div>
              <span className="text-xs text-white/40 block mb-1.5">Message Body</span>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/90 whitespace-pre-wrap max-h-48 overflow-y-auto font-sans">
                {selectedMessage?.content ? (
                  parseReplyMessage(selectedMessage.content).cleanContent || selectedMessage.content
                ) : (
                  <span className="text-white/20 italic">No text content</span>
                )}
              </div>
            </div>

            {/* Attachments list */}
            {selectedMessage?.attachments && selectedMessage.attachments.length > 0 && (
              <div>
                <span className="text-xs text-white/40 block mb-1.5">
                  Attachments ({selectedMessage.attachments.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedMessage.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AttachmentIcon url={att.url} />
                        <span className="text-xs text-white/70 truncate max-w-[240px] font-mono">
                          {att.url.split("/").pop()}
                        </span>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium ml-2 px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 transition-all"
                      >
                        <ExternalLink className="w-3 h-3" /> View Media
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => {
                if (selectedMessage) handleDeleteMessage(selectedMessage);
              }}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Message
            </button>
            <button
              onClick={() => setSelectedMessage(null)}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium text-white transition-all"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

