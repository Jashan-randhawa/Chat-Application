import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore, type Chat } from "@/store/appStore";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import {
  getMyChats, searchUsers, sendFriendRequest, getNotifications,
  acceptFriendRequest, newGroupChat, getMyFriends, getFriendsStatuses, getMessages
} from "@/services/api";
import ChatListItem from "./ChatListItem";
import ChatAvatar from "./Avatar";
import StatusList from "../status/StatusList";
import CallModal, { type CallStatus } from "./CallModal";
import { useWebRTC } from "@/hooks/useWebRTC";
import {
  Search, Bell, LogOut, Plus, X, Check, UserPlus, Users,
  Loader2, MessageCircle, UsersRound, UserCheck, Settings, CircleDot, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, fileFormat } from "@/lib/features";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type PanelType = "chats" | "notifications" | "groups" | "friends" | "search" | "status" | null;

interface Props {
  selectedChat: string | null;
  onSelectChat: (id: string) => void;
  chats: Chat[];
  onRefreshChats: () => void;
}

interface ChatPreview {
  text: string;
  time: string;
}

export default function Sidebar({ selectedChat, onSelectChat, chats, onRefreshChats }: Props) {
  const {
    user, logout, notificationCount, resetNotificationCount,
    newMessagesAlert, onlineUsers,
  } = useAppStore();
  const navigate = useNavigate();

  const [activePanel, setActivePanel] = useState<PanelType>("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [unseenStatusCount, setUnseenStatusCount] = useState(0);
  const [chatPreviews, setChatPreviews] = useState<Record<string, ChatPreview>>({});

  const socket = useSocket();

  // Fetch unseen status count for badge on Status nav icon
  const fetchUnseenStatusCount = useCallback(async () => {
    try {
      const { data } = await getFriendsStatuses();
      const statuses: any[] = data.statuses || [];
      const count = statuses.filter(
        (s: any) => !s.isOwn && s.slides.some((sl: any) => !sl.viewedByMe)
      ).length;
      setUnseenStatusCount(count);
    } catch {
      setUnseenStatusCount(0);
    }
  }, []);

  useEffect(() => { fetchUnseenStatusCount(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on(EVENTS.STATUS_UPDATED, fetchUnseenStatusCount);
    return () => { socket.off(EVENTS.STATUS_UPDATED, fetchUnseenStatusCount); };
  }, [socket, fetchUnseenStatusCount]);

  // Search users state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout>>();

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  // Friends state
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  // ── Friend call state ──────────────────────────────────────────────────────
  interface CallParty { _id: string; name: string; }
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [callRemoteUser, setCallRemoteUser] = useState<CallParty | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const callPeerIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<{ offer: RTCSessionDescriptionInit; chatId: string } | null>(null);
  const {
    getLocalStream, createPeerConnection, createOffer, createAnswer,
    setRemoteAnswer, addIceCandidate, toggleMute, cleanup: cleanupWebRTC,
  } = useWebRTC();

  const endFriendCall = useCallback(() => {
    if (socket && callPeerIdRef.current) {
      const chat = chats.find((c) => !c.groupChat && c.members.includes(callPeerIdRef.current!));
      if (chat) socket.emit(EVENTS.CALL_ENDED, { chatId: chat._id, toUserId: callPeerIdRef.current });
    }
    cleanupWebRTC();
    setCallStatus(null); setCallRemoteUser(null); setRemoteStream(null);
    callPeerIdRef.current = null; pendingOfferRef.current = null;
  }, [socket, chats, cleanupWebRTC]);

  const handleFriendCall = useCallback(async (friend: { _id: string; name: string }) => {
    if (!socket || !user) return;
    const chat = chats.find((c) => !c.groupChat && c.members.includes(friend._id));
    if (!chat) { toast.error("Start a chat with this friend first"); return; }
    try {
      await getLocalStream();
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId: chat._id, candidate: c, toUserId: friend._id }),
        (s) => { setRemoteStream(s); setCallStatus("active"); }
      );
      const offer = await createOffer();
      if (!offer) return;
      callPeerIdRef.current = friend._id;
      setCallRemoteUser({ _id: friend._id, name: friend.name });
      setCallStatus("outgoing");
      socket.emit(EVENTS.CALL_OFFER, { chatId: chat._id, offer, toUserId: friend._id });
    } catch { cleanupWebRTC(); setCallStatus(null); }
  }, [socket, user, chats, getLocalStream, createPeerConnection, createOffer, cleanupWebRTC]);

  // Listen for incoming calls and signalling in friends panel
  useEffect(() => {
    if (!socket) return;
    const onOffer = ({ chatId, offer, from }: { chatId: string; offer: RTCSessionDescriptionInit; from: CallParty }) => {
      if (callStatus) return;
      callPeerIdRef.current = from._id;
      pendingOfferRef.current = { offer, chatId };
      setCallRemoteUser(from);
      setCallStatus("incoming");
    };
    const onAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      await setRemoteAnswer(answer);
    };
    const onIce = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      await addIceCandidate(candidate);
    };
    const onEnded = () => { cleanupWebRTC(); setCallStatus(null); setCallRemoteUser(null); setRemoteStream(null); callPeerIdRef.current = null; pendingOfferRef.current = null; };
    socket.on(EVENTS.CALL_OFFER, onOffer);
    socket.on(EVENTS.CALL_ANSWER, onAnswer);
    socket.on(EVENTS.ICE_CANDIDATE, onIce);
    socket.on(EVENTS.CALL_ENDED, onEnded);
    return () => {
      socket.off(EVENTS.CALL_OFFER, onOffer);
      socket.off(EVENTS.CALL_ANSWER, onAnswer);
      socket.off(EVENTS.ICE_CANDIDATE, onIce);
      socket.off(EVENTS.CALL_ENDED, onEnded);
    };
  }, [socket, callStatus, setRemoteAnswer, addIceCandidate, cleanupWebRTC]);

  const handleAcceptFriendCall = useCallback(async () => {
    if (!socket || !pendingOfferRef.current || !callPeerIdRef.current) return;
    const { offer, chatId } = pendingOfferRef.current;
    const peerId = callPeerIdRef.current;
    try {
      await getLocalStream();
      createPeerConnection(
        (c) => socket.emit(EVENTS.ICE_CANDIDATE, { chatId, candidate: c, toUserId: peerId }),
        (s) => { setRemoteStream(s); setCallStatus("active"); }
      );
      const answer = await createAnswer(offer);
      if (!answer) return;
      socket.emit(EVENTS.CALL_ANSWER, { chatId, answer, toUserId: peerId });
    } catch { endFriendCall(); }
  }, [socket, getLocalStream, createPeerConnection, createAnswer, endFriendCall]);

  // Group state
  const [groupName, setGroupName] = useState("");
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupFriendsLoading, setGroupFriendsLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const filteredChats = chats.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    let cancelled = false;

    const createPreviewText = (msg: any) => {
      if (msg?.content?.trim()) return msg.content.trim();
      const firstAttachment = msg?.attachments?.[0]?.url || "";
      if (!firstAttachment) return "No messages yet";
      const type = fileFormat(firstAttachment);
      if (type === "image") return "📷 Photo";
      if (type === "video") return "🎥 Video";
      if (type === "audio") return "🎵 Audio";
      const ext = firstAttachment.split(".").pop()?.toLowerCase();
      if (ext === "webm" || ext === "ogg") return "🎤 Voice message";
      return "📎 Attachment";
    };

    const loadPreviews = async () => {
      const entries = await Promise.all(
        chats.map(async (chat) => {
          try {
            const { data } = await getMessages(chat._id, 1);
            const messages = data?.messages || [];
            const latest = messages[messages.length - 1];
            if (!latest) return [chat._id, { text: "No messages yet", time: "" }] as const;
            return [
              chat._id,
              {
                text: createPreviewText(latest),
                time: formatTime(latest.createdAt || ""),
              },
            ] as const;
          } catch {
            return [chat._id, { text: "No messages yet", time: "" }] as const;
          }
        })
      );

      if (cancelled) return;
      setChatPreviews(Object.fromEntries(entries));
    };

    if (chats.length) loadPreviews();
    else setChatPreviews({});

    return () => {
      cancelled = true;
    };
  }, [chats]);

  // Search users
  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query);
    if (searchTimer) clearTimeout(searchTimer);
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await searchUsers(query);
        setSearchResults(data.users || []);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 400);
    setSearchTimer(timer);
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      toast.success("Friend request sent!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send request");
    }
  };

  const openNotifications = async () => {
    setActivePanel("notifications");
    resetNotificationCount();
    setNotifLoading(true);
    try {
      const { data } = await getNotifications();
      setNotifications(data.allRequests || []);
    } catch { setNotifications([]); }
    finally { setNotifLoading(false); }
  };

  const handleFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      await acceptFriendRequest(requestId, accept);
      toast.success(accept ? "Request accepted!" : "Request rejected");
      setNotifications((prev) => prev.filter((n) => n._id !== requestId));
      if (accept) onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const openFriends = async () => {
    setActivePanel("friends");
    setFriendsLoading(true);
    try {
      const { data } = await getMyFriends();
      setFriends(data.friends || []);
    } catch { setFriends([]); }
    finally { setFriendsLoading(false); }
  };

  const openGroups = async () => {
    setActivePanel("groups");
    setGroupFriendsLoading(true);
    try {
      const { data } = await getMyFriends();
      setAllFriends(data.friends || []);
    } catch { setAllFriends([]); }
    finally { setGroupFriendsLoading(false); }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) { toast.error("Enter group name"); return; }
    if (selectedMembers.length < 2) { toast.error("Select at least 2 members"); return; }
    try {
      await newGroupChat(groupName, selectedMembers);
      toast.success("Group created!");
      setShowCreateGroup(false);
      setGroupName("");
      setSelectedMembers([]);
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create group");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handlePanelChange = (panel: PanelType) => {
    if (panel === activePanel) return;
    if (panel === "notifications") { openNotifications(); return; }
    if (panel === "friends") { openFriends(); return; }
    if (panel === "groups") { openGroups(); return; }
    if (panel === "status") { setUnseenStatusCount(0); }
    setActivePanel(panel);
  };

  const navItems = [
    {
      id: "chats" as PanelType,
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Chats",
      badge: null,
    },
    {
      id: "notifications" as PanelType,
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      badge: notificationCount > 0 ? notificationCount : null,
    },
    {
      id: "groups" as PanelType,
      icon: <UsersRound className="w-5 h-5" />,
      label: "Groups",
      badge: null,
    },
    {
      id: "friends" as PanelType,
      icon: <UserCheck className="w-5 h-5" />,
      label: "Friends",
      badge: null,
    },
    {
      id: "search" as PanelType,
      icon: <Search className="w-5 h-5" />,
      label: "Search Users",
      badge: null,
    },
    {
      id: "status" as PanelType,
      icon: <CircleDot className="w-5 h-5" />,
      label: "Status",
      badge: unseenStatusCount > 0 ? unseenStatusCount : null,
    },
  ];

  return (
    <div className="flex h-full">
      {/* ── Vertical Icon Rail ────────────────────────────────── */}
      <div className="flex flex-col items-center w-14 bg-card border-r border-border py-3 gap-1 flex-shrink-0">
        {/* Avatar at top */}
        <div className="mb-3">
          <ChatAvatar name={user?.name || "User"} src={user?.avatar?.url} size="sm" />
        </div>

        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handlePanelChange(item.id)}
            title={item.label}
            className={cn(
              "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
              activePanel === item.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {item.icon}
            {item.badge !== null && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Logout at bottom */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* ── Panel Area ────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 bg-card overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── CHATS PANEL ── */}
          {activePanel === "chats" && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border">
                <h2 className="font-bold text-base">Messages</h2>
              </div>

<div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No conversations found</p>
                    <p className="text-xs mt-1 opacity-60">Search for users to start chatting</p>
                  </div>
                ) : (
                  filteredChats.map((chat) => (
                    <ChatListItem
                      key={chat._id}
                      chat={chat}
                      selectedChat={selectedChat}
                      onSelect={onSelectChat}
                      newMessageAlert={newMessagesAlert.find((a) => a.chatId === chat._id)}
                      lastMessageText={chatPreviews[chat._id]?.text}
                      lastMessageTime={chatPreviews[chat._id]?.time}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── NOTIFICATIONS PANEL ── */}
          {activePanel === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Notifications</h2>
              </div>

              <div className="flex-1 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Bell className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No new notifications</p>
                    <p className="text-xs mt-1 opacity-60">Friend requests will appear here</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground px-1 font-medium uppercase tracking-wide mb-3">
                      Friend Requests
                    </p>
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/50"
                      >
                        <ChatAvatar name={n.sender.name} src={n.sender.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{n.sender.name}</p>
                          <p className="text-xs text-muted-foreground">Wants to be your friend</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleFriendRequest(n._id, true)}
                            className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-opacity"
                            title="Accept"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleFriendRequest(n._id, false)}
                            className="w-8 h-8 rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                            title="Decline"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── GROUPS PANEL ── */}
          {activePanel === "groups" && (
            <motion.div
              key="groups"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersRound className="w-4 h-4 text-primary" />
                  <h2 className="font-bold text-base">Groups</h2>
                </div>
                <button
                  onClick={() => setShowCreateGroup(!showCreateGroup)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    showCreateGroup
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-muted-foreground hover:text-foreground"
                  )}
                  title="Create group"
                >
                  {showCreateGroup ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Create group form */}
              <AnimatePresence>
                {showCreateGroup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-border overflow-hidden bg-accent/20"
                  >
                    <div className="p-3 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        New Group
                      </p>
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group name..."
                        className="w-full bg-background rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border placeholder:text-muted-foreground"
                      />
                      <div className="space-y-1 max-h-36 overflow-y-auto">
                        {groupFriendsLoading ? (
                          <div className="flex justify-center py-3">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          </div>
                        ) : allFriends.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            No friends to add
                          </p>
                        ) : (
                          allFriends.map((f) => (
                            <label
                              key={f._id}
                              className="flex items-center gap-3 py-1.5 px-1 rounded-lg cursor-pointer hover:bg-accent/50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(f._id)}
                                onChange={(e) =>
                                  setSelectedMembers(
                                    e.target.checked
                                      ? [...selectedMembers, f._id]
                                      : selectedMembers.filter((id) => id !== f._id)
                                  )
                                }
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <ChatAvatar name={f.name} src={f.avatar} size="sm" />
                              <span className="text-sm">{f.name}</span>
                            </label>
                          ))
                        )}
                      </div>
                      <button
                        onClick={handleCreateGroup}
                        className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Create Group {selectedMembers.length > 0 && `(${selectedMembers.length} selected)`}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Group chats list */}
              <div className="flex-1 overflow-y-auto">
                {chats.filter((c) => c.groupChat).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UsersRound className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No groups yet</p>
                    <p className="text-xs mt-1 opacity-60">Click + to create a group</p>
                  </div>
                ) : (
                  chats
                    .filter((c) => c.groupChat)
                    .map((chat) => (
                      <ChatListItem
                        key={chat._id}
                        chat={chat}
                        selectedChat={selectedChat}
                        onSelect={(id) => { onSelectChat(id); setActivePanel("chats"); }}
                        newMessageAlert={newMessagesAlert.find((a) => a.chatId === chat._id)}
                        lastMessageText={chatPreviews[chat._id]?.text}
                        lastMessageTime={chatPreviews[chat._id]?.time}
                      />
                    ))
                )}
              </div>
            </motion.div>
          )}

          {/* ── FRIENDS PANEL ── */}
          {activePanel === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Friends</h2>
                {friends.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                    {friends.length}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {friendsLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UserCheck className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No friends yet</p>
                    <p className="text-xs mt-1 opacity-60">Search users to add friends</p>
                  </div>
                ) : (
                  <div className="p-3 space-y-1">
                    {friends.map((f) => {
                      const isOnline = onlineUsers.includes(f._id);
                      return (
                        <div
                          key={f._id}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                        >
                          <div className="relative">
                            <ChatAvatar name={f.name} src={f.avatar} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                          </div>
                          <button
                            onClick={() => handleFriendCall(f)}
                            className="w-8 h-8 rounded-full bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center transition-colors mr-1"
                            title="Voice call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              // Find direct chat with this friend
                              const chat = chats.find(
                                (c) => !c.groupChat && c.members.includes(f._id)
                              );
                              if (chat) { onSelectChat(chat._id); setActivePanel("chats"); }
                            }}
                            className="w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                            title="Message"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── SEARCH USERS PANEL ── */}
          {activePanel === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Find People</h2>
              </div>

              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={userSearchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    placeholder="Search by name..."
                    autoFocus
                    className="w-full bg-muted rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => { setUserSearchQuery(""); setSearchResults([]); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {searchLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="p-3 space-y-1">
                    {searchResults.map((u) => (
                      <div
                        key={u._id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors"
                      >
                        <ChatAvatar name={u.name} src={u.avatar} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleSendRequest(u._id)}
                          className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-opacity"
                          title="Send friend request"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : userSearchQuery && !searchLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No users found</p>
                    <p className="text-xs mt-1 opacity-60">Try a different name</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <UserPlus className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">Search for people</p>
                    <p className="text-xs mt-1 opacity-60">Find friends to start chatting</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── STATUS PANEL ── */}
          {activePanel === "status" && (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col h-full"
            >
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <CircleDot className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Status</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <StatusList fullPage />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Friend voice call modal */}
      {callStatus && callRemoteUser && (
        <CallModal
          status={callStatus}
          remoteUser={callRemoteUser}
          remoteStream={remoteStream}
          onAccept={handleAcceptFriendCall}
          onDecline={endFriendCall}
          onEnd={endFriendCall}
          onToggleMute={toggleMute}
        />
      )}
    </div>
  );
}
