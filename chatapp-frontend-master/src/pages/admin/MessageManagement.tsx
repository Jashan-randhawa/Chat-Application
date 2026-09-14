import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminGetMessages, adminDeleteMessage } from "@/services/api";
import { formatDate } from "@/lib/features";
import { parseReplyMessage } from "@/lib/replyUtils";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2, Search, MessageSquare, Paperclip, Image, Video, FileText, Trash2,
  Filter, Eye, MessageCircle, ExternalLink, Calendar, Hash,
  AlertTriangle, ShieldAlert, ShieldCheck, AlertCircle, Ban, Flag,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ModerationData {
  isFlagged: boolean;
  severity: "high" | "medium" | "low" | "clean";
  score: number;
  categories: string[];
  reasons: string[];
  matchedPatterns: string[];
  spamScore: number;
  inappropriateScore: number;
}

interface AdminMessage {
  _id: string;
  content: string;
  attachments: { url: string }[];
  sender: { _id?: string; name: string; username?: string; avatar: string };
  chat: string;
  chatName?: string;
  groupChat: boolean;
  createdAt: string;
  moderation?: ModerationData;
}

function AttachmentIcon({ url }: { url: string }) {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "webm"].includes(ext)) return <Video className="w-3 h-3" />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <Image className="w-3 h-3" />;
  return <FileText className="w-3 h-3" />;
}

type FilterType = "all" | "flagged" | "spam" | "inappropriate" | "media" | "text";

export default function MessageManagement() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilter = (searchParams.get("filter") as FilterType) || "all";
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  useEffect(() => {
    adminGetMessages()
      .then(({ data }) => setMessages(data.messages || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSetFilter = (newFilter: FilterType) => {
    setFilter(newFilter);
    setSearchParams(newFilter === "all" ? {} : { filter: newFilter });
  };

  const handleDeleteMessage = async (msg: AdminMessage) => {
    if (!confirm("Are you sure you want to delete this message and its associated attachments permanently?")) {
      return;
    }
    setDeletingId(msg._id);
    try {
      await adminDeleteMessage(msg._id);
      toast.success("Message deleted successfully");
      setMessages((prev) => prev.filter((m) => m._id !== msg._id));
      if (selectedMessage?._id === msg._id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete message");
    } finally {
      setDeletingId(null);
    }
  };

  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  // Moderation summary counters
  const flaggedCount = messages.filter((m) => m.moderation?.isFlagged).length;
  const spamCount = messages.filter((m) =>
    m.moderation?.categories?.some((c) => c.toLowerCase().includes("spam") || c.toLowerCase().includes("link"))
  ).length;
  const inappCount = messages.filter((m) =>
    m.moderation?.categories?.some((c) => c.toLowerCase().includes("inappropriate"))
  ).length;
  const highSeverityCount = messages.filter((m) => m.moderation?.severity === "high").length;

  const filtered = messages.filter((m) => {
    const matchQ =
      m.sender.name.toLowerCase().includes(query.toLowerCase()) ||
      (m.sender.username && m.sender.username.toLowerCase().includes(query.toLowerCase())) ||
      m.content.toLowerCase().includes(query.toLowerCase()) ||
      (m.chatName && m.chatName.toLowerCase().includes(query.toLowerCase())) ||
      (m.moderation?.reasons && m.moderation.reasons.some((r) => r.toLowerCase().includes(query.toLowerCase())));

    let matchF = true;
    if (filter === "flagged") {
      matchF = !!m.moderation?.isFlagged;
    } else if (filter === "spam") {
      matchF = !!m.moderation?.categories?.some((c) => c.toLowerCase().includes("spam") || c.toLowerCase().includes("link"));
    } else if (filter === "inappropriate") {
      matchF = !!m.moderation?.categories?.some((c) => c.toLowerCase().includes("inappropriate"));
    } else if (filter === "media") {
      matchF = !!(m.attachments && m.attachments.length > 0);
    } else if (filter === "text") {
      matchF = !m.attachments || m.attachments.length === 0;
    }

    return matchQ && matchF;
  });

  const mediaCount = messages.filter((m) => m.attachments && m.attachments.length > 0).length;

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
      {/* Header & Quick Moderation Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Messages & Moderation Log</span>
            {flaggedCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                <ShieldAlert className="w-3 h-3" />
                {flaggedCount} Flagged
              </span>
            )}
          </h1>
          <p className="text-xs text-white/40 mt-0.5">
            {messages.length} total messages recorded • Real-time spam and inappropriate content analysis
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sender, content, alert..."
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-white/25 transition-all"
          />
        </div>
      </div>

      {/* Moderation Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <button
          onClick={() => handleSetFilter("flagged")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === "flagged"
              ? "bg-red-500/20 border-red-500/40 text-white"
              : "bg-[#161b22] border-white/5 hover:border-red-500/20 text-white/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Flagged Messages
            </span>
            {highSeverityCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/30 text-red-300 font-bold">
                {highSeverityCount} High
              </span>
            )}
          </div>
          <span className="text-xl font-bold text-red-400">{flaggedCount}</span>
        </button>

        <button
          onClick={() => handleSetFilter("spam")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === "spam"
              ? "bg-amber-500/20 border-amber-500/40 text-white"
              : "bg-[#161b22] border-white/5 hover:border-amber-500/20 text-white/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Spam & Scams
            </span>
          </div>
          <span className="text-xl font-bold text-amber-400">{spamCount}</span>
        </button>

        <button
          onClick={() => handleSetFilter("inappropriate")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === "inappropriate"
              ? "bg-rose-500/20 border-rose-500/40 text-white"
              : "bg-[#161b22] border-white/5 hover:border-rose-500/20 text-white/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-400" /> Inappropriate Content
            </span>
          </div>
          <span className="text-xl font-bold text-rose-400">{inappCount}</span>
        </button>

        <button
          onClick={() => handleSetFilter("all")}
          className={`p-3 rounded-xl border text-left transition-all ${
            filter === "all"
              ? "bg-emerald-500/20 border-emerald-500/40 text-white"
              : "bg-[#161b22] border-white/5 hover:border-emerald-500/20 text-white/80"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-white/50 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Clean
            </span>
          </div>
          <span className="text-xl font-bold text-emerald-400">
            {messages.length - flaggedCount}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {(
          [
            { id: "all", label: `All (${messages.length})` },
            { id: "flagged", label: `⚠️ Flagged (${flaggedCount})` },
            { id: "spam", label: `🛡️ Spam & Scams (${spamCount})` },
            { id: "inappropriate", label: `🚫 Inappropriate (${inappCount})` },
            { id: "media", label: `📎 Media (${mediaCount})` },
            { id: "text", label: "📝 Text Only" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleSetFilter(tab.id as FilterType)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
              filter === tab.id
                ? "bg-white/15 text-white font-semibold border border-white/20 shadow-sm"
                : "bg-white/5 text-white/40 hover:text-white/80 hover:bg-white/10 border border-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages List Table */}
      <div className="bg-[#161b22] border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-white/5 text-[11px] font-semibold text-white/25 uppercase tracking-wider">
          <span className="col-span-3">Sender</span>
          <span className="col-span-5">Content / Moderation Status</span>
          <span className="col-span-1 text-center">Media</span>
          <span className="col-span-2">Time</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/20">
            <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No messages match your filter</p>
          </div>
        ) : (
          filtered.map((m, i) => {
            const isFlagged = m.moderation?.isFlagged;
            const isHigh = m.moderation?.severity === "high";

            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.015 }}
                className={`grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-5 py-3.5 border-b border-white/5 last:border-b-0 items-center hover:bg-white/[0.02] transition-colors ${
                  isHigh
                    ? "bg-red-500/[0.03] border-l-4 border-l-red-500"
                    : isFlagged
                    ? "bg-amber-500/[0.03] border-l-4 border-l-amber-500"
                    : ""
                }`}
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

                {/* Content & Moderation Status */}
                <div className="col-span-5 min-w-0 cursor-pointer" onClick={() => setSelectedMessage(m)}>
                  {m.content ? (
                    <p className="text-sm text-white/85 truncate hover:text-white transition-colors">
                      {parseReplyMessage(m.content).cleanContent || m.content}
                    </p>
                  ) : (
                    <span className="text-xs text-white/25 italic">Media only</span>
                  )}

                  {/* Moderation Alerts */}
                  {isFlagged ? (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          isHigh
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {isHigh ? <ShieldAlert className="w-3 h-3 text-red-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {isHigh ? "High Alert" : "Flagged"}: {m.moderation?.categories?.join(" • ")}
                      </span>
                      {m.moderation?.reasons?.[0] && (
                        <span className="text-[10px] text-white/40 truncate max-w-[220px]">
                          {m.moderation.reasons[0]}
                        </span>
                      )}
                    </div>
                  ) : (
                    m.chatName && (
                      <p className="text-[10px] text-white/35 truncate mt-0.5">
                        {m.groupChat ? "Group: " : "Direct: "}
                        <span className="text-white/50">{m.chatName}</span>
                      </p>
                    )
                  )}
                </div>

                {/* Attachments */}
                <div className="col-span-1 flex items-center justify-center">
                  {m.attachments?.length > 0 ? (
                    <button
                      onClick={() => setSelectedMessage(m)}
                      className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-lg transition-colors"
                    >
                      <AttachmentIcon url={m.attachments[0].url} />
                      <span>{m.attachments.length}</span>
                    </button>
                  ) : (
                    <span className="text-white/15 text-xs">—</span>
                  )}
                </div>

                {/* Time */}
                <div className="col-span-2">
                  <span className="text-xs text-white/40 font-mono">{formatDate(m.createdAt)}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => setSelectedMessage(m)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    title="Inspect message payload & moderation report"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMessage(m)}
                    disabled={deletingId === m._id}
                    className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-40"
                    title="Delete message permanently"
                  >
                    {deletingId === m._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Inspect Message Modal */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="bg-[#161b22] border-white/10 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              Message Payload & Moderation
            </DialogTitle>
            <p className="text-xs text-white/40 mt-1">
              Sent by {selectedMessage?.sender.name} ({selectedMessage?.sender.username ? `@${selectedMessage.sender.username}` : "No username"}) on{" "}
              {selectedMessage?.createdAt ? formatDate(selectedMessage.createdAt) : "—"}
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Moderation Alert Card */}
            {selectedMessage?.moderation?.isFlagged ? (
              <div
                className={`p-3.5 rounded-xl border ${
                  selectedMessage.moderation.severity === "high"
                    ? "bg-red-500/10 border-red-500/30 text-red-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    {selectedMessage.moderation.severity === "high" ? (
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    Content Moderation Alert
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedMessage.moderation.severity === "high"
                          ? "bg-red-500/30 text-red-300"
                          : "bg-amber-500/30 text-amber-300"
                      }`}
                    >
                      {selectedMessage.moderation.severity} Risk
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      Risk Score: {selectedMessage.moderation.score}/100
                    </span>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {selectedMessage.moderation.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white border border-white/10"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Reasons List */}
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold block text-white/70">Detected Violations:</span>
                  <ul className="text-xs space-y-1 pl-3.5 list-disc text-white/80">
                    {selectedMessage.moderation.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>

                {/* Matched patterns */}
                {selectedMessage.moderation.matchedPatterns?.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px]">
                    <span className="text-white/40 mr-1.5">Matched Keywords:</span>
                    {selectedMessage.moderation.matchedPatterns.map((p, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono mr-1 text-amber-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Clean message: No spam or inappropriate patterns detected.</span>
              </div>
            )}

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
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Message
            </button>
            <button
              onClick={() => setSelectedMessage(null)}
              className="px-4 py-1.5 bg-white/10 hover:bg-white/15 rounded-xl text-xs font-medium text-white transition-all cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}


