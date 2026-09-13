import { cn } from "@/lib/utils";
import ChatAvatar from "./Avatar";
import { useAppStore } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import { Users } from "lucide-react";
import type { Chat } from "@/store/appStore";

interface Props {
  chat: Chat;
  selectedChat: string | null;
  onSelect: (id: string) => void;
  newMessageAlert?: { chatId: string; count: number };
  isOnline?: boolean;
  lastMessageTime?: string;
  lastMessageText?: string;
}

export default function ChatListItem({
  chat,
  selectedChat,
  onSelect,
  newMessageAlert,
  isOnline,
  lastMessageTime,
  lastMessageText,
}: Props) {
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;
  const isActive = selectedChat === chat._id;

  return (
    <button
      onClick={() => onSelect(chat._id)}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-3 transition-all text-left relative cursor-pointer border-b border-border/40",
        isActive
          ? "bg-accent/80 dark:bg-zinc-800/60 shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-primary"
          : "hover:bg-accent/40"
      )}
    >
      <div className="relative shrink-0">
        <ChatAvatar
          name={chat.name}
          src={chat.avatar?.[0]}
          size="lg"
        />
        {chat.groupChat ? (
          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-xs">
            <Users className="w-3 h-3 text-primary-foreground" />
          </span>
        ) : isOnline ? (
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-card ring-2 ring-emerald-500/20" />
        ) : null}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className={cn("font-semibold text-sm truncate tracking-tight text-foreground", isActive && activeTheme.accentText)}>
            {chat.name}
          </span>
          {lastMessageTime && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-2 font-mono">
              {lastMessageTime}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground truncate pr-2">
            {newMessageAlert && newMessageAlert.count > 0
              ? `${newMessageAlert.count} new message${newMessageAlert.count > 1 ? "s" : ""}`
              : lastMessageText || "No messages yet"}
          </p>
          {newMessageAlert && newMessageAlert.count > 0 && (
            <span className={cn("shrink-0 min-w-[20px] h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-xs", activeTheme.dotColor)}>
              {newMessageAlert.count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
