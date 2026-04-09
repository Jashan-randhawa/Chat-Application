import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { useAppStore, type Message } from "@/store/appStore";
import { EVENTS } from "@/config/constants";
import { getMessages, getChatDetails } from "@/services/api";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import CallModal, { type CallStatus } from "./CallModal";
import { useWebRTC } from "@/hooks/useWebRTC";
import { MessageSquare, Loader2, ChevronsDown } from "lucide-react";
import type { Chat } from "@/store/appStore";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  chatId: string | null;
  chats: Chat[];
  onBack: () => void;
}

interface CallParty { _id: string; name: string; }

const PAGE_SIZE = 20;

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

export default function ChatArea({ chatId, chats, onBack }: Props) {
  const socket = useSocket();
  const { user, onlineUsers, removeNewMessagesAlert } = useAppStore();

  // Scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);     // the scrollable container
  const bottomRef = useRef<HTMLDivElement>(null);      // sentinel at the bottom
  const topSentinelRef = useRef<HTMLDivElement>(null); // sentinel at the top for load-more

  // Track scroll position before prepending old messages so we can restore it
  const savedScrollHeight = useRef(0);
  const savedScrollTop = useRef(0);

  // "User has scrolled up" — show the scroll-to-bottom FAB
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [atBottom, setAtBottom] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatDetail, setChatDetail] = useState<any>(null);

  // ── Call state ─────────────────────────────────────────────────────────────
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [callRemoteUser, setCallRemoteUser] = useState<CallParty | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callPeerIdRef = useRef<string | null>(null);

  const {
    getLocalStream, createPeerConnection, createOffer, createAnswer,
    setRemoteAnswer, addIceCandidate, toggleMute, cleanup: cleanupWebRTC,
  } = useWebRTC();

  const chat = chats.find((c) => c._id === chatId);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getPeerId = useCallback((forChatId: string): string | null => {
    const c = chats.find((ch) => ch._id === forChatId);
    if (!c || c.groupChat || !user) return null;
    return c.members.find((m) => m !== user._id) ?? null;
  }, [chats, user]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  // ── Scroll listener — detect whether user is near bottom ──────────────────
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

  // ── IntersectionObserver to auto-load more when scrolled to top ───────────
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
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

  // ── Initial load when chat changes ────────────────────────────────────────
  useEffect(() => {
    if (!chatId) return;
    setMessages([]);
    setPage(1);
    setTotalPages(1);
    setLoading(true);
    removeNewMessagesAlert(chatId);

    getMessages(chatId, 1)
      .then(({ data }) => {
        setMessages(sortMessagesChronologically(data.messages || []));
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    getChatDetails(chatId, true)
      .then(({ data }) => setChatDetail(data.chat))
      .catch(() => {});
  }, [chatId]);

  // ── Scroll to bottom on initial load ──────────────────────────────────────
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom("instant");
    }
  }, [loading]); // only fires when loading finishes

  // ── Join/leave chat ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chatId || !socket || !user || !chat) return;
    socket.emit(EVENTS.CHAT_JOINED, { userId: user._id, members: chat.members });
    return () => {
      socket.emit(EVENTS.CHAT_LEAVED, { userId: user._id, members: chat.members });
    };
  }, [chatId, socket, user?._id]);

  // ── Socket: new messages + typing ─────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = ({ chatId: cId, message }: { chatId: string; message: Message }) => {
      if (cId !== chatId) return;
      setMessages((prev) => sortMessagesChronologically([...prev, message]));
    };

    const onTypingStart = ({ chatId: cId }: { chatId: string }) => {
      if (cId === chatId) setIsTyping(true);
    };
    const onTypingStop = ({ chatId: cId }: { chatId: string }) => {
      if (cId === chatId) setIsTyping(false);
    };

    socket.on(EVENTS.NEW_MESSAGE, onNewMessage);
    socket.on(EVENTS.START_TYPING, onTypingStart);
    socket.on(EVENTS.STOP_TYPING, onTypingStop);

    return () => {
      socket.off(EVENTS.NEW_MESSAGE, onNewMessage);
      socket.off(EVENTS.START_TYPING, onTypingStart);
      socket.off(EVENTS.STOP_TYPING, onTypingStop);
    };
  }, [socket, chatId]);

  // ── Auto-scroll when a new message arrives (only if near bottom) ──────────
  // We track messages.length separately so we can distinguish "new message" from
  // "history prepend" (load more). History prepend is handled by restoring scroll.
  const prevLengthRef = useRef(0);
  useEffect(() => {
    const newLength = messages.length;
    if (newLength > prevLengthRef.current && !loadingMore) {
      // If user is near bottom, scroll to show the new message
      if (atBottom) {
        scrollToBottom("smooth");
      }
    }
    prevLengthRef.current = newLength;
  }, [messages.length]);

  // ── Restore scroll position after prepending old messages ─────────────────
  // We set savedScrollHeight BEFORE the state update, then restore AFTER render.
  const restoreScrollPending = useRef(false);

  useEffect(() => {
    if (restoreScrollPending.current && scrollRef.current) {
      const el = scrollRef.current;
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = savedScrollTop.current + (newScrollHeight - savedScrollHeight.current);
      restoreScrollPending.current = false;
    }
  });

  // ── Load more (older) messages ────────────────────────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (!chatId || page >= totalPages || loadingMore) return;
    const nextPage = page + 1;

    // Save scroll position BEFORE state update
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
    } catch {}
    finally { setLoadingMore(false); }
  }, [chatId, page, totalPages, loadingMore]);

  // ── Call logic (unchanged, condensed) ─────────────────────────────────────
  const endCall = useCallback(() => {
    if (socket && callPeerIdRef.current && chatId) {
      socket.emit(EVENTS.CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });
    }
    cleanupWebRTC();
    setCallStatus(null); setCallRemoteUser(null); setRemoteStream(null);
    callPeerIdRef.current = null; pendingOfferRef.current = null;
  }, [socket, chatId, cleanupWebRTC]);

  const handleStartCall = useCallback(async () => {
    if (!socket || !chatId || !user) return;
    const peerId = getPeerId(chatId);
    if (!peerId) return;
    try {
      await getLocalStream();
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId, candidate: c, toUserId: peerId }),
        (s) => { setRemoteStream(s); setCallStatus("active"); }
      );
      const offer = await createOffer();
      if (!offer) return;
      callPeerIdRef.current = peerId;
      setCallRemoteUser({ _id: peerId, name: chat?.name ?? "Unknown" });
      setCallStatus("outgoing");
      socket.emit(EVENTS.CALL_OFFER, { chatId, offer, toUserId: peerId });
    } catch { cleanupWebRTC(); setCallStatus(null); }
  }, [socket, chatId, user, chat, getPeerId, getLocalStream, createPeerConnection, createOffer, cleanupWebRTC]);

  const handleAcceptCall = useCallback(async () => {
    if (!socket || !pendingOfferRef.current || !chatId || !callPeerIdRef.current) return;
    try {
      await getLocalStream();
      const peerId = callPeerIdRef.current;
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId, candidate: c, toUserId: peerId }),
        (s) => { setRemoteStream(s); setCallStatus("active"); }
      );
      const answer = await createAnswer(pendingOfferRef.current);
      if (!answer) return;
      pendingOfferRef.current = null;
      socket.emit(EVENTS.CALL_ANSWER, { chatId, answer, toUserId: peerId });
    } catch { endCall(); }
  }, [socket, chatId, getLocalStream, createPeerConnection, createAnswer, endCall]);

  const handleDeclineCall = useCallback(() => {
    if (socket && callPeerIdRef.current && chatId) {
      socket.emit(EVENTS.CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });
    }
    cleanupWebRTC(); setCallStatus(null); setCallRemoteUser(null);
    callPeerIdRef.current = null; pendingOfferRef.current = null;
  }, [socket, chatId, cleanupWebRTC]);

  useEffect(() => {
    if (!socket) return;
    const onOffer = ({ chatId: cid, offer, from }: { chatId: string; offer: RTCSessionDescriptionInit; from: CallParty }) => {
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
      cleanupWebRTC(); setCallStatus(null); setCallRemoteUser(null);
      setRemoteStream(null); callPeerIdRef.current = null; pendingOfferRef.current = null;
    });
    return () => {
      socket.off(EVENTS.CALL_OFFER, onOffer);
      socket.off(EVENTS.CALL_ANSWER);
      socket.off(EVENTS.ICE_CANDIDATE);
      socket.off(EVENTS.CALL_ENDED);
    };
  }, [socket, callStatus, setRemoteAnswer, addIceCandidate, cleanupWebRTC]);

  // ── isOnline ───────────────────────────────────────────────────────────────
  const isOnline = chat && !chat.groupChat && chat.members.some((m) => onlineUsers.includes(m));

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!chatId || !chat) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center chat-pattern">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold mb-1">ChatApp</h2>
            <p className="text-muted-foreground text-sm">Select a conversation to start messaging</p>
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <ChatHeader
          chat={chat}
          isTyping={isTyping}
          onBack={onBack}
          onCall={handleStartCall}
        />

        {/* ── Message scroll area ─────────────────────────────────────────── */}
        <div className="flex-1 relative overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto chat-pattern px-3 md:px-6 py-4 space-y-1.5 scroll-smooth"
          >
            {/* Top sentinel: triggers load-more via IntersectionObserver */}
            <div ref={topSentinelRef} className="h-1" />

            {/* Load-more spinner (at top) */}
            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}

            {/* Manual load-more fallback */}
            {!loadingMore && page < totalPages && (
              <div className="flex justify-center py-1">
                <button
                  onClick={loadMoreMessages}
                  className="text-xs text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                >
                  Load older messages
                </button>
              </div>
            )}

            {/* Initial load spinner */}
            {loading && messages.length === 0 && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isSelf={msg.sender._id === user?._id}
                showName={chat.groupChat}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-chat-bubble-received rounded-2xl rounded-bl-sm px-4 py-2 shadow-sm">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 0.25, 0.5].map((delay, i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                        style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>

          {/* ── Scroll-to-bottom FAB ──────────────────────────────────────── */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                transition={{ duration: 0.15 }}
                onClick={() => scrollToBottom("smooth")}
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-primary hover:bg-accent transition-colors z-10"
              >
                <ChevronsDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <ChatInput chatId={chatId} members={chat.members} />
      </div>
    </>
  );
}
