import ChatAvatar from "./Avatar";
import { ArrowLeft, Phone, MoreVertical } from "lucide-react";
import type { Chat } from "@/store/appStore";

interface Props {
  chat: Chat;
  isOnline?: boolean;
  isTyping?: boolean;
  onBack: () => void;
  onCall?: () => void; // NEW: triggers an outgoing call
}

export default function ChatHeader({ chat, isOnline, isTyping, onBack, onCall }: Props) {
  // Only allow calls in 1-on-1 chats (group calling is not supported)
  const canCall = !chat.groupChat && !!onCall;

  return (
    <div className="flex items-center gap-3 px-3 md:px-5 py-3 bg-card border-b border-border">
      <button
        onClick={onBack}
        className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-accent transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <ChatAvatar name={chat.name} src={chat.avatar?.[0]} size="md" />

      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate">{chat.name}</h2>
        <p className="text-xs text-muted-foreground">
          {isTyping
            ? "typing..."
            : chat.groupChat
            ? `${chat.members.length} members`
            : ""}
        </p>
      </div>

      <div className="flex items-center gap-1">
        {/* Phone button: disabled for group chats */}
        <button
          onClick={canCall ? onCall : undefined}
          disabled={!canCall}
          title={canCall ? "Start voice call" : "Calls not supported in groups"}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
