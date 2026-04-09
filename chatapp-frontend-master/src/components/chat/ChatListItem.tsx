import { cn } from "@/lib/utils";
import ChatAvatar from "./Avatar";
import { useAppStore } from "@/store/appStore";
import { Users } from "lucide-react";
import type { Chat } from "@/store/appStore";

interface Props {
  chat: Chat;
  selectedChat: string | null;
  onSelect: (id: string) => void;
  newMessageAlert?: { chatId: string; count: number };
  isOnline?: boolean;
  lastMessageTime?: string;
}

export default function ChatListItem({ chat, selectedChat, onSelect, newMessageAlert, isOnline, lastMessageTime }: Props) {
  const isActive = selectedChat === chat._id;

  return (
    <button
      onClick={() => onSelect(chat._id)}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left",
        "hover:bg-accent/50",
        isActive && "bg-accent"
      )}
    >
      <div className="relative">
        <ChatAvatar
          name={chat.name}
          src={chat.avatar?.[0]}
          size="lg"
        />
        {chat.groupChat && (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Users className="w-3 h-3 text-primary-foreground" />
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn("font-semibold text-sm truncate", isActive && "text-primary")}>
            {chat.name}
          </span>
          {lastMessageTime && (
            <span className="text-[11px] text-muted-foreground flex-shrink-0 ml-2">
              {lastMessageTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate pr-2">
            {newMessageAlert && newMessageAlert.count > 0
              ? `${newMessageAlert.count} new message${newMessageAlert.count > 1 ? "s" : ""}`
              : "Tap to open chat"}
          </p>
          {newMessageAlert && newMessageAlert.count > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center px-1.5">
              {newMessageAlert.count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
