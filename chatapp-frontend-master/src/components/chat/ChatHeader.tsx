import ChatAvatar from "./Avatar";
import { ArrowLeft, Phone, Info, Search } from "lucide-react";
import type { Chat } from "@/store/appStore";

interface Props {
  chat: Chat;
  isOnline?: boolean;
  isTyping?: boolean;
  onBack: () => void;
  onCall?: () => void;
  onOpenDetails?: () => void;
  onToggleSearch?: () => void;
  isSearching?: boolean;
}

export default function ChatHeader({
  chat,
  isOnline,
  isTyping,
  onBack,
  onCall,
  onOpenDetails,
  onToggleSearch,
  isSearching,
}: Props) {
  // Only allow calls in 1-on-1 chats (group calling is not supported)
  const canCall = !chat.groupChat && !!onCall;

  return (
    <div className="flex items-center gap-3 px-3 md:px-5 py-3 bg-card border-b border-border select-none z-10">
      <button
        onClick={onBack}
        className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-accent transition-colors cursor-pointer"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar with click-to-open details */}
      <div className="relative cursor-pointer" onClick={onOpenDetails}>
        <ChatAvatar name={chat.name} src={chat.avatar?.[0]} size="md" />
        {!chat.groupChat && isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
        )}
      </div>

      {/* Title and status (clickable for details sheet) */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={onOpenDetails}
        title="View conversation details"
      >
        <h2 className="font-semibold text-sm truncate flex items-center gap-1.5">
          <span>{chat.name}</span>
        </h2>
        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
          {isTyping ? (
            <span className="text-primary font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              typing...
            </span>
          ) : chat.groupChat ? (
            `${chat.members.length} members • tap for info`
          ) : isOnline ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active now</span>
          ) : (
            "Offline"
          )}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isSearching
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={isSearching ? "Close search" : "Search in conversation"}
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Phone button: disabled for group chats */}
        <button
          onClick={canCall ? onCall : undefined}
          disabled={!canCall}
          title={canCall ? "Start encrypted voice call" : "Calls not supported in groups"}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Phone className="w-4 h-4" />
        </button>

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Chat Details & Members"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

