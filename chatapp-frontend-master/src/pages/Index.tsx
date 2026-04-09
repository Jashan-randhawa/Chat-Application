import { useCallback, useEffect, useState } from "react";
import { useAppStore, type Chat } from "@/store/appStore";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import { getMyChats } from "@/services/api";
import Sidebar from "@/components/chat/Sidebar";
import ChatArea from "@/components/chat/ChatArea";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, setNewMessagesAlert, incrementNotification, setOnlineUsers } = useAppStore();
  const socket = useSocket();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(true);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    try {
      const { data } = await getMyChats();
      setChats(data.chats || []);
    } catch { }
    finally { setChatsLoading(false); }
  }, []);

  useEffect(() => {
    if (user) fetchChats();
  }, [user, fetchChats]);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessageAlert = ({ chatId }: { chatId: string }) => {
      if (chatId !== selectedChat) setNewMessagesAlert(chatId);
    };
    const handleNewRequest = () => incrementNotification();
    const handleRefetchChats = () => fetchChats();
    const handleOnlineUsers = (users: string[]) => setOnlineUsers(users);

    socket.on(EVENTS.NEW_MESSAGE_ALERT, handleNewMessageAlert);
    socket.on(EVENTS.NEW_REQUEST, handleNewRequest);
    socket.on(EVENTS.REFETCH_CHATS, handleRefetchChats);
    socket.on(EVENTS.ONLINE_USERS, handleOnlineUsers);

    return () => {
      socket.off(EVENTS.NEW_MESSAGE_ALERT, handleNewMessageAlert);
      socket.off(EVENTS.NEW_REQUEST, handleNewRequest);
      socket.off(EVENTS.REFETCH_CHATS, handleRefetchChats);
      socket.off(EVENTS.ONLINE_USERS, handleOnlineUsers);
    };
  }, [socket, selectedChat]);

  if (chatsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <div className={cn(
        "w-full md:w-[380px] md:min-w-[320px] md:max-w-[420px] flex-shrink-0 md:block",
        selectedChat ? "hidden" : "block"
      )}>
        <Sidebar
          selectedChat={selectedChat}
          onSelectChat={setSelectedChat}
          chats={chats}
          onRefreshChats={fetchChats}
        />
      </div>
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        selectedChat ? "flex" : "hidden md:flex"
      )}>
        <ChatArea chatId={selectedChat} chats={chats} onBack={() => setSelectedChat(null)} />
      </div>
    </div>
  );
}
