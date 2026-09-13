import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAppStore, type Message, type Chat } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import { EVENTS } from "@/config/constants";
import { getMessages, getChatDetails, markMessageAsRead, sendAttachments } from "@/services/api";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import ChatDetailsSheet from "./ChatDetailsSheet";
import CallModal, { type CallStatus } from "./CallModal";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  MessageSquare,
  Loader2,
  ChevronsDown,
  Search,
  X,
  UploadCloud,
  Sparkles,
  Camera,
  Mic,
  ShieldCheck,
  UsersRound,
  PhoneCall,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  chatId: string | null;
  chats: Chat[];
  onBack: () => void;
  onRefreshChats?: () => void;
}

interface CallParty {
  _id: string;
  name: string;
}

function getMessageTimestamp(message: Message): number {
  const ts = new Date(message.createdAt).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function sortMessagesChronologically(messages: Message[]): Message[] {
  return [...messages].sort((a, b) => {
    const timeDiff = getMessageTimestamp(a) - getMessageTimestamp(b);
    if (timeDiff !== 0) return timeDiff;
    return a._id.localeCompare(b._id);
  });
}

function formatMessageDay(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ChatArea({ chatId, chats, onBack, onRefreshChats }: Props) {
  const socket = useSocket();
  const { user, onlineUsers, removeNewMessagesAlert, palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  const savedScrollHeight = useRef(0);
  const savedScrollTop = useRef(0);

  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatDetail, setChatDetail] = useState<any>(null);

  // New states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [callRemoteUser, setCallRemoteUser] = useState<CallParty | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callPeerIdRef = useRef<string | null>(null);

  const {
    getLocalStream,
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    toggleMute,
    cleanup: cleanupWebRTC,
  } = useWebRTC();

  const chat = chats.find((c) => c._id === chatId);

  const getPeerId = useCallback(
    (forChatId: string): string | null => {
      const c = chats.find((ch) => ch._id === forChatId);
      if (!c || c.groupChat || !user) return null;
      return c.members.find((m) => m !== user._id) ?? null;
    },
    [chats, user]
  );

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const nearBottom = distFromBottom < 120;
      setAtBottom(nearBottom);
      setShowScrollBtn(!nearBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver to auto-load older messages
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && page < totalPages) {
          loadMoreMessages();
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, page, totalPages]);

  // Initial load when chat changes
  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    setPage(1);
    setTotalPages(1);
    setLoading(true);
    setReplyingTo(null);
    setIsSearching(false);
    setSearchQuery("");
    removeNewMessagesAlert(chatId);

    getMessages(chatId, 1)
      .then(({ data }) => {
        const sorted = sortMessagesChronologically(data.messages || []);
        setMessages(sorted);
        setTotalPages(data.totalPages || 1);

        // Automatically mark incoming messages as read
        if (user) {
          sorted.forEach((msg) => {
            if (msg.sender?._id !== user._id && !(msg.readBy && msg.readBy.includes(user._id))) {
              markMessageAsRead(msg._id).catch(() => {});
            }
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getChatDetails(chatId, true)
      .then(({ data }) => setChatDetail(data.chat))
      .catch(() => {});
  }, [chatId]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom("instant");
    }
  }, [loading]);

  // Join/leave chat socket events
  useEffect(() => {
    if (!chatId || !socket || !user || !chat) return;
    socket.emit(EVENTS.CHAT_JOINED, { userId: user._id, members: chat.members });
    return () => {
      socket.emit(EVENTS.CHAT_LEAVED, { userId: user._id, members: chat.members });
    };
  }, [chatId, socket, user?._id]);

  // Real-time socket events: new messages, typing, delivery, and read receipts
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = ({ chatId: cId, message }: { chatId: string; message: Message }) => {
      if (cId !== chatId) return;
      setMessages((prev) => sortMessagesChronologically([...prev, message]));

      // If we are currently active in this chat and message is from someone else, mark as read immediately
      if (user && message.sender?._id !== user._id) {
        markMessageAsRead(message._id).catch(() => {});
      }
    };

    const onMessageDelivered = ({
      chatId: cId,
      messageId,
      deliveredTo,
    }: {
      chatId: string;
      messageId: string;
      deliveredTo: string[];
    }) => {
      if (cId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                deliveredTo: Array.from(new Set([...(msg.deliveredTo || []), ...deliveredTo])),
              }
            : msg
        )
      );
    };

    const onMessageRead = ({
      chatId: cId,
      messageId,
      userId,
    }: {
      chatId: string;
      messageId: string;
      userId: string;
    }) => {
      if (cId !== chatId) return;
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                readBy: Array.from(new Set([...(msg.readBy || []), userId])),
              }
            : msg
        )
      );
    };

    const onTypingStart = ({ chatId: cId }: { chatId: string }) => {
      if (cId === chatId) setIsTyping(true);
    };
    const onTypingStop = ({ chatId: cId }: { chatId: string }) => {
      if (cId === chatId) setIsTyping(false);
    };

    const onRefetchChats = () => {
      if (chatId) {
        getChatDetails(chatId, true)
          .then(({ data }) => setChatDetail(data.chat))
          .catch(() => {});
      }
      onRefreshChats?.();
    };

    socket.on(EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(EVENTS.MESSAGE_DELIVERED, onMessageDelivered);
    socket.on(EVENTS.MESSAGE_READ, onMessageRead);
    socket.on(EVENTS.START_TYPING, onTypingStart);
    socket.on(EVENTS.STOP_TYPING, onTypingStop);
    socket.on(EVENTS.REFETCH_CHATS, onRefetchChats);

    return () => {
      socket.off(EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(EVENTS.MESSAGE_DELIVERED, onMessageDelivered);
      socket.off(EVENTS.MESSAGE_READ, onMessageRead);
      socket.off(EVENTS.START_TYPING, onTypingStart);
      socket.off(EVENTS.STOP_TYPING, onTypingStop);
      socket.off(EVENTS.REFETCH_CHATS, onRefetchChats);
    };
  }, [socket, chatId, user?._id, onRefreshChats]);

  // Auto-scroll on new message if near bottom
  const prevLengthRef = useRef(0);
  useEffect(() => {
    const newLength = messages.length;
    if (newLength > prevLengthRef.current && !loadingMore) {
      if (atBottom) {
        scrollToBottom("smooth");
      }
    }
    prevLengthRef.current = newLength;
  }, [messages.length, atBottom, loadingMore]);

  // Restore scroll position after prepend
  const restoreScrollPending = useRef(false);
  useEffect(() => {
    if (restoreScrollPending.current && scrollRef.current) {
      const el = scrollRef.current;
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = savedScrollTop.current + (newScrollHeight - savedScrollHeight.current);
      restoreScrollPending.current = false;
    }
  });

  // Load more older messages
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || page >= totalPages || loadingMore) return;
    const nextPage = page + 1;

    const el = scrollRef.current;
    if (el) {
      savedScrollHeight.current = el.scrollHeight;
      savedScrollTop.current = el.scrollTop;
      restoreScrollPending.current = true;
    }

    setLoadingMore(true);
    try {
      const { data } = await getMessages(chatId, nextPage);
      const older = data.messages || [];
      setMessages((prev) => sortMessagesChronologically([...older, ...prev]));
      setPage(nextPage);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, page, totalPages, loadingMore]);

  // Call handlers
  const endCall = useCallback(() => {
    if (socket && callPeerIdRef.current && chatId) {
      socket.emit(EVENTS.CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });
    }
    cleanupWebRTC();
    setCallStatus(null);
    setCallRemoteUser(null);
    setRemoteStream(null);
    callPeerIdRef.current = null;
    pendingOfferRef.current = null;
  }, [socket, chatId, cleanupWebRTC]);

  const handleStartCall = useCallback(async () => {
    if (!socket || !chatId || !user) return;
    const peerId = getPeerId(chatId);
    if (!peerId) return;
    try {
      await getLocalStream();
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId, candidate: c, toUserId: peerId }),
        (s) => {
          setRemoteStream(s);
          setCallStatus("active");
        }
      );
      const offer = await createOffer();
      if (!offer) return;
      callPeerIdRef.current = peerId;
      setCallRemoteUser({ _id: peerId, name: chat?.name ?? "Unknown" });
      setCallStatus("outgoing");
      socket.emit(EVENTS.CALL_OFFER, { chatId, offer, toUserId: peerId });
    } catch {
      cleanupWebRTC();
      setCallStatus(null);
    }
  }, [socket, chatId, user, chat, getPeerId, getLocalStream, createPeerConnection, createOffer, cleanupWebRTC]);

  const handleAcceptCall = useCallback(async () => {
    if (!socket || !pendingOfferRef.current || !chatId || !callPeerIdRef.current) return;
    try {
      await getLocalStream();
      const peerId = callPeerIdRef.current;
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId, candidate: c, toUserId: peerId }),
        (s) => {
          setRemoteStream(s);
          setCallStatus("active");
        }
      );
      const answer = await createAnswer(pendingOfferRef.current);
      if (!answer) return;
      pendingOfferRef.current = null;
      socket.emit(EVENTS.CALL_ANSWER, { chatId, answer, toUserId: peerId });
    } catch {
      endCall();
    }
  }, [socket, chatId, getLocalStream, createPeerConnection, createAnswer, endCall]);

  const handleDeclineCall = useCallback(() => {
    if (socket && callPeerIdRef.current && chatId) {
      socket.emit(EVENTS.CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });
    }
    cleanupWebRTC();
    setCallStatus(null);
    setCallRemoteUser(null);
    callPeerIdRef.current = null;
    pendingOfferRef.current = null;
  }, [socket, chatId, cleanupWebRTC]);

  useEffect(() => {
    if (!socket) return;
    const onOffer = ({
      chatId: cid,
      offer,
      from,
    }: {
      chatId: string;
      offer: RTCSessionDescriptionInit;
      from: CallParty;
    }) => {
      if (callStatus) return;
      pendingOfferRef.current = offer;
      callPeerIdRef.current = from._id;
      setCallRemoteUser(from);
      setCallStatus("incoming");
    };
    socket.on(EVENTS.CALL_OFFER, onOffer);
    socket.on(EVENTS.CALL_ANSWER, ({ answer }) => setRemoteAnswer(answer));
    socket.on(EVENTS.ICE_CANDIDATE, ({ candidate }) => addIceCandidate(candidate));
    socket.on(EVENTS.CALL_ENDED, () => {
      cleanupWebRTC();
      setCallStatus(null);
      setCallRemoteUser(null);
      setRemoteStream(null);
      callPeerIdRef.current = null;
      pendingOfferRef.current = null;
    });
    return () => {
      socket.off(EVENTS.CALL_OFFER, onOffer);
      socket.off(EVENTS.CALL_ANSWER);
      socket.off(EVENTS.ICE_CANDIDATE);
      socket.off(EVENTS.CALL_ENDED);
    };
  }, [socket, callStatus, setRemoteAnswer, addIceCandidate, cleanupWebRTC]);

  // Drag and drop handlers for sending files directly
  const handleDropFiles = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!chatId) return;
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;
    if (files.length > 5) {
      toast.error("Max 5 files allowed");
      return;
    }

    const formData = new FormData();
    formData.append("chatId", chatId);
    files.forEach((f) => formData.append("files", f));
    try {
      await sendAttachments(formData);
      toast.success("Files uploaded successfully");
    } catch {
      toast.error("File upload failed");
    }
  };

  const isOnline = chat && !chat.groupChat && chat.members.some((m) => onlineUsers.includes(m));

  // Filter messages by search query
  const displayedMessages = searchQuery.trim()
    ? messages.filter((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Empty state when no chat selected
  if (!chatId || !chat) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-[#0b0f17] transition-colors p-6">
        <div className="flex flex-col items-center gap-6 animate-fade-in relative z-10 text-center max-w-md">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border/80 flex items-center justify-center shadow-xl">
              <MessageSquare className="w-9 h-9 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">
              Antigravity Chat
            </h2>
            <p className="text-muted-foreground text-xs leading-relaxed max-w-sm">
              Select a conversation from the sidebar or start a new direct or group chat to begin messaging.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 w-full pt-2">
            <div className="p-3 rounded-2xl bg-card/80 border border-border/60 text-left flex items-start gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Encrypted</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Private, secure chats</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-card/80 border border-border/60 text-left flex items-start gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Voice Calls</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Peer-to-peer audio</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-card/80 border border-border/60 text-left flex items-start gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Rich Media</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Photos, voice notes</p>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-card/80 border border-border/60 text-left flex items-start gap-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <UsersRound className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Group Chats</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Team conversations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {callStatus && callRemoteUser && (
        <CallModal
          status={callStatus}
          remoteUser={callRemoteUser}
          remoteStream={remoteStream}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
        />
      )}

      {/* Chat Details & Management Sheet */}
      <ChatDetailsSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        chat={chatDetail || chat}
        messages={messages}
        onCall={handleStartCall}
        onRefreshChats={onRefreshChats || (() => {})}
        onCloseChat={onBack}
      />

      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDropFiles}
      >
        {/* Drag-and-drop overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 z-40 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-primary m-4 rounded-3xl animate-fade-in pointer-events-none">
            <UploadCloud className="w-12 h-12 text-primary animate-bounce mb-2" />
            <p className="text-sm font-semibold text-foreground">Drop files to send directly</p>
            <p className="text-xs text-muted-foreground">Up to 5 files (images, audio, video, docs)</p>
          </div>
        )}

        <ChatHeader
          chat={chatDetail || chat}
          isOnline={isOnline}
          isTyping={isTyping}
          onBack={onBack}
          onCall={handleStartCall}
          onOpenDetails={() => setDetailsOpen(true)}
          onToggleSearch={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchQuery("");
          }}
          isSearching={isSearching}
        />

        {/* Floating Search Bar */}
        {isSearching && (
          <div className="px-4 py-2 bg-card border-b border-border flex items-center gap-2 animate-fade-in z-20">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this conversation..."
              className="flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted">
                {displayedMessages.length} match{displayedMessages.length === 1 ? "" : "es"}
              </span>
            )}
            <button
              onClick={() => {
                setIsSearching(false);
                setSearchQuery("");
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Message scroll area ─────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto px-3 md:px-6 py-4 space-y-2.5 scroll-smooth bg-slate-100/70 dark:bg-[#0b0f17] transition-colors"
          >
            {/* Top sentinel for loading older messages */}
            <div ref={topSentinelRef} className="h-1" />

            {/* Load more spinner */}
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}

            {!loadingMore && page < totalPages && (
              <div className="flex justify-center py-1">
                <button
                  onClick={loadMoreMessages}
                  className="text-xs text-primary/80 hover:text-primary bg-primary/10 px-3 py-1 rounded-full transition-colors cursor-pointer"
                >
                  Load older messages
                </button>
              </div>
            )}

            {/* Initial loading */}
            {loading && messages.length === 0 && (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty conversation starter prompts */}
            {!loading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <div className="max-w-xs">
                  <p className="text-sm font-semibold text-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Start the conversation by saying hello or sharing a file.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: "👋 Hello there!" });
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors shadow-xs cursor-pointer"
                  >
                    👋 Say Hello
                  </button>
                  <button
                    onClick={() => {
                      if (socket) {
                        socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: "🚀 Ready to collaborate!" });
                      }
                    }}
                    className="px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors shadow-xs cursor-pointer"
                  >
                    🚀 Ready to collaborate!
                  </button>
                </div>
              </div>
            )}

            {/* Messages with Day Separators */}
            {displayedMessages.map((msg, index) => {
              const currentDay = formatMessageDay(msg.createdAt);
              const prevMsg = displayedMessages[index - 1];
              const prevDay = prevMsg ? formatMessageDay(prevMsg.createdAt) : null;
              const showDateSeparator = currentDay !== prevDay;

              return (
                <div id={`msg-${msg._id}`} key={msg._id} className="space-y-2 rounded-2xl transition-all duration-300">
                  {showDateSeparator && (
                    <div className="flex justify-center my-3 select-none">
                      <span className="px-3.5 py-1 rounded-full bg-card/85 dark:bg-zinc-900/85 border border-border/80 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground shadow-xs backdrop-blur-md">
                        {currentDay}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={msg}
                    isSelf={msg.sender?._id === user?._id}
                    showName={chat.groupChat}
                    onReply={(replyMsg) => setReplyingTo(replyMsg)}
                  />
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start my-1 animate-fade-in">
                <div className="bg-card/90 dark:bg-zinc-900/90 border border-border/70 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm backdrop-blur-md">
                  <div className="flex gap-1.5 items-center h-4">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <span
                        key={i}
                        className={cn("w-2 h-2 rounded-full animate-bounce", activeTheme.dotColor)}
                        style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>

          {/* Scroll-to-bottom FAB */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                transition={{ duration: 0.15 }}
                onClick={() => scrollToBottom("smooth")}
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-primary hover:bg-muted transition-colors z-20 cursor-pointer"
                title="Scroll to latest message"
              >
                <ChevronsDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <ChatInput
          chatId={chatId}
          members={chat.members}
          replyTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </>
  );
}

