import ChatAvatar from "./Avatar";
import { ArrowLeft, Phone, Info, Search } from "lucide-react";
import type { Chat } from "@/store/appStore";
import PaletteSwitcher from "@/components/PaletteSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

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
    <div className="flex items-center justify-between gap-3 px-3.5 md:px-6 py-3 bg-card/85 backdrop-blur-xl border-b border-border/60 select-none z-20 sticky top-0 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-accent transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Avatar with click-to-open details */}
        <div className="relative cursor-pointer group" onClick={onOpenDetails}>
          <ChatAvatar name={chat.name} src={chat.avatar?.[0]} size="md" />
          {!chat.groupChat && isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card shadow-xs ring-2 ring-emerald-500/20 animate-pulse" />
          )}
        </div>

        {/* Title and status */}
        <div
          className="min-w-0 cursor-pointer"
          onClick={onOpenDetails}
          title="View conversation details"
        >
          <h2 className="font-bold text-sm md:text-base truncate tracking-tight text-foreground flex items-center gap-1.5">
            <span>{chat.name}</span>
          </h2>
          <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
            {isTyping ? (
              <span className="text-primary font-medium flex items-center gap-1.5">
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                </span>
                typing...
              </span>
            ) : chat.groupChat ? (
              <span className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                {chat.members.length} members • Tap for info
              </span>
            ) : isOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Active now
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Action controls & Theme tools */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isSearching
                ? "bg-primary/15 text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
          title={canCall ? "Start voice call" : "Voice calls not available in groups"}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Phone className="w-4 h-4" />
        </button>

        {/* Theme and Executive Palette Switchers */}
        <PaletteSwitcher compact align="right" />
        <ThemeToggle />

        {onOpenDetails && (
          <button
            onClick={onOpenDetails}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all cursor-pointer"
            title="Chat Details & Media"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
