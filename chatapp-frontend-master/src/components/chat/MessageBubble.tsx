import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime, fileFormat } from "@/lib/features";
import { useAppStore, type Message } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import VoiceMessage from "./VoiceMessage";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Music,
  Video,
  ZoomIn,
  Check,
  CheckCheck,
  Reply,
  Copy,
  Smile,
} from "lucide-react";
import { toast } from "sonner";
import { parseReplyMessage, scrollToQuotedMessage } from "@/lib/replyUtils";

interface Props {
  message: Message;
  isSelf: boolean;
  showName?: boolean;
  onReply?: (message: Message) => void;
}

const NAME_COLORS = [
  "text-emerald-500",
  "text-sky-500",
  "text-violet-500",
  "text-amber-500",
  "text-rose-500",
  "text-cyan-500",
  "text-indigo-500",
];

function getNameColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return NAME_COLORS[h % NAME_COLORS.length];
}

function getFileName(url: string) {
  try {
    const parts = new URL(url).pathname.split("/");
    const raw = parts[parts.length - 1];
    return decodeURIComponent(raw).split("?")[0] || "File";
  } catch {
    return "File";
  }
}

function isVoiceNote(url: string): boolean {
  const name = getFileName(url).toLowerCase();
  return name.startsWith("voice-note-") || name.endsWith(".webm") || name.endsWith(".ogg");
}

const VOICE_WAVEFORM_BAR_HEIGHTS = [
  0.32, 0.45, 0.72, 0.58, 0.88, 0.66, 0.4, 0.84,
  0.5, 0.62, 0.78, 0.35, 0.7, 0.52, 0.9, 0.42,
  0.65, 1, 0.55, 0.74, 0.38, 0.8, 0.63, 0.47,
  0.86, 0.54, 0.76, 0.44, 0.69, 0.51, 0.82, 0.46,
];

// ── Image with lightbox ───────────────────────────────────────────────────────
function ImageAttachment({ url }: { url: string }) {
  const [lightbox, setLightbox] = useState(false);
  return (
    <>
      <div
        className="relative group cursor-pointer rounded-xl overflow-hidden max-w-[240px]"
        onClick={() => setLightbox(true)}
      >
        <img
          src={url}
          alt="attachment"
          className="w-full h-auto object-cover rounded-xl max-h-56"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <img
            src={url}
            alt="attachment"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="absolute top-4 right-4 p-2.5 bg-white/15 hover:bg-white/30 rounded-full text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      )}
    </>
  );
}

function VideoAttachment({ url }: { url: string }) {
  return (
    <div className="rounded-xl overflow-hidden max-w-[280px]">
      <video src={url} controls className="w-full h-auto max-h-48 rounded-xl bg-black" preload="metadata" />
    </div>
  );
}

function AudioAttachment({
  url,
  isSelf,
  time,
  isRead,
  isDelivered,
}: {
  url: string;
  isSelf: boolean;
  time: string;
  isRead?: boolean;
  isDelivered?: boolean;
}) {
  if (isVoiceNote(url)) {
    return (
      <VoiceMessage
        audioUrl={url}
        isRead={isRead}
        isDelivered={isDelivered}
        msg={{
          from: isSelf ? "me" : "other",
          time,
          waveform: VOICE_WAVEFORM_BAR_HEIGHTS,
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2 max-w-[260px]",
        isSelf ? "bg-black/10" : "bg-black/5"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isSelf ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Music className="w-4 h-4" />
      </div>
      <audio controls src={url} className="flex-1 h-8 min-w-0" style={{ accentColor: "hsl(var(--primary))" }} />
    </div>
  );
}

function FileAttachment({ url, isSelf }: { url: string; isSelf: boolean }) {
  const name = getFileName(url);
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 max-w-[260px] transition-colors group",
        isSelf ? "bg-black/10 hover:bg-black/15" : "bg-black/5 hover:bg-black/10"
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
          isSelf ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {ext}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Tap to open</p>
      </div>
      <Download className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  );
}

function Attachment({
  url,
  isSelf,
  time,
  isRead,
  isDelivered,
}: {
  url: string;
  isSelf: boolean;
  time: string;
  isRead?: boolean;
  isDelivered?: boolean;
}) {
  const fname = getFileName(url).toLowerCase();
  if (isVoiceNote(url) || fname.endsWith(".webm") || fname.endsWith(".ogg")) {
    return (
      <VoiceMessage
        audioUrl={url}
        isRead={isRead}
        isDelivered={isDelivered}
        msg={{
          from: isSelf ? "me" : "other",
          time,
          waveform: VOICE_WAVEFORM_BAR_HEIGHTS,
        }}
      />
    );
  }

  const type = fileFormat(url);
  if (type === "image") return <ImageAttachment url={url} />;
  if (type === "video") return <VideoAttachment url={url} />;
  if (type === "audio")
    return (
      <AudioAttachment
        url={url}
        isSelf={isSelf}
        time={time}
        isRead={isRead}
        isDelivered={isDelivered}
      />
    );
  return <FileAttachment url={url} isSelf={isSelf} />;
}

function MessageStatusIndicator({ message, isSelf }: { message: Message; isSelf: boolean }) {
  if (!isSelf) return null;
  const isRead = message.readBy && message.readBy.length > 0;
  const isDelivered = message.deliveredTo && message.deliveredTo.length > 0;

  if (isRead) {
    return (
      <span title="Read by recipient" className="inline-flex items-center text-cyan-200 dark:text-cyan-300 ml-1">
        <CheckCheck className="w-3.5 h-3.5 drop-shadow-[0_0_4px_rgba(103,232,249,0.5)]" />
      </span>
    );
  }
  if (isDelivered) {
    return (
      <span title="Delivered" className="inline-flex items-center text-white/80 ml-1">
        <CheckCheck className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span title="Sent" className="inline-flex items-center text-white/60 ml-1">
      <Check className="w-3 h-3" />
    </span>
  );
}

export default function MessageBubble({ message, isSelf, showName, onReply }: Props) {
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.emerald;
  const isRead = !!(message.readBy && message.readBy.length > 0);
  const isDelivered = !!(message.deliveredTo && message.deliveredTo.length > 0);

  const [reactions, setReactions] = useState<string[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // System alerts / Admin broadcast messages
  if (message.sender?.name === "Admin") {
    return (
      <div className="flex justify-center my-2 select-none">
        <span className="px-3.5 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/50 text-[11px] font-medium shadow-xs backdrop-blur-xs">
          {message.content}
        </span>
      </div>
    );
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const onlyVoiceNoteAttachment =
    !message.content &&
    !!message.attachments &&
    message.attachments.length === 1 &&
    isVoiceNote(message.attachments[0].url);

  const { replyTo: parsedReply, cleanContent } = parseReplyMessage(message.content || "");
  const effectiveReply = parsedReply || (message.replyTo ? {
    id: message.replyTo._id,
    sender: message.replyTo.senderName,
    text: message.replyTo.content,
    type: "text" as const,
  } : null);

  const handleCopy = () => {
    const textToCopy = cleanContent || message.content;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    toast.success("Copied to clipboard");
  };

  const handleToggleReaction = (emoji: string) => {
    setReactions((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev, emoji]
    );
    setShowReactionPicker(false);
  };

  return (
    <div className="relative group/wrapper">
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16 }}
        drag={onReply ? "x" : false}
        dragConstraints={{ left: 0, right: 60 }}
        dragElastic={0.4}
        onDragEnd={(_, info) => {
          if (info.offset.x > 45 && onReply) {
            onReply(message);
          }
        }}
        onDoubleClick={() => {
          if (onReply) onReply(message);
        }}
        className={cn("group/msg relative flex items-end gap-1.5 my-0.5 select-text touch-pan-y", isSelf ? "justify-end" : "justify-start")}
      >
        {/* Swipe to reply icon feedback indicator */}
        {onReply && (
          <div className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-active/msg:opacity-80 transition-opacity pointer-events-none text-primary">
            <Reply className="w-4 h-4" />
          </div>
        )}

        {/* Quick Action Floating Toolbar (visible on hover) */}
        <div
          className={cn(
            "absolute -top-7 opacity-0 group-hover/msg:opacity-100 transition-all duration-150 flex items-center gap-1 bg-card/95 border border-border rounded-full p-1 shadow-md z-10",
            isSelf ? "right-2" : "left-2"
          )}
        >
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          {onReply && (
            <button
              onClick={() => onReply(message)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          )}
          {(cleanContent || message.content) && (
            <button
              onClick={handleCopy}
              className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Floating Emoji Picker Tray */}
        {showReactionPicker && (
          <div
            className={cn(
              "absolute -top-11 z-20 flex items-center gap-1.5 bg-card border border-border rounded-full px-2 py-1 shadow-lg",
              isSelf ? "right-0" : "left-0"
            )}
          >
            {["👍", "❤️", "😂", "🔥", "🎉", "😮"].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggleReaction(emoji)}
                className="text-sm hover:scale-125 transition-transform p-0.5 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Main Bubble */}
        <div
          className={cn(
            "max-w-[82%] md:max-w-[68%] relative transition-all",
            hasAttachments && !cleanContent
              ? ""
              : cn(
                  "px-3.5 py-2 rounded-2xl shadow-sm backdrop-blur-md",
                  isSelf
                    ? cn(activeTheme.sentBubbleClass, "rounded-tr-xs")
                    : "bg-card/90 dark:bg-zinc-900/90 text-card-foreground border border-border/80 rounded-tl-xs"
                )
          )}
        >
          {/* Sender Name for Group Chats */}
          {showName && !isSelf && message.sender && (
            <p className={cn("text-xs font-semibold mb-1 tracking-tight", getNameColor(message.sender.name))}>
              {message.sender.name}
            </p>
          )}

          {/* WhatsApp-Style Quoted Message Card with Click-to-Scroll Jump */}
          {effectiveReply && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (effectiveReply.id) {
                  scrollToQuotedMessage(effectiveReply.id);
                }
              }}
              title={effectiveReply.id ? "Click to jump to quoted message" : undefined}
              className={cn(
                "mb-2 p-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-colors cursor-pointer select-none",
                isSelf
                  ? "bg-black/15 hover:bg-black/25 text-white/95 border-l-4 border-white/90"
                  : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground border-l-4 border-primary"
              )}
            >
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1">
                  <Reply className={cn("w-3 h-3 shrink-0", isSelf ? "text-white/80" : "text-primary")} />
                  <p className={cn("font-semibold text-[11px] truncate", isSelf ? "text-white" : "text-primary")}>
                    {effectiveReply.sender}
                  </p>
                </div>
                <p className="truncate opacity-80 text-[11px] mt-0.5 line-clamp-1">
                  {effectiveReply.text || "Message"}
                </p>
              </div>
              {effectiveReply.thumbnailUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-border/40">
                  <img
                    src={effectiveReply.thumbnailUrl}
                    alt="attachment preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {hasAttachments && (
            <div className={cn("space-y-1.5", cleanContent ? "mb-2" : "")}>
              {message.attachments!.map((att, i) => (
                <Attachment
                  key={i}
                  url={att.url}
                  isSelf={isSelf}
                  time={formatTime(message.createdAt)}
                  isRead={isRead}
                  isDelivered={isDelivered}
                />
              ))}
            </div>
          )}

          {/* Message Text Content */}
          {cleanContent && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap selection:bg-primary/20 font-normal">
              {cleanContent}
            </p>
          )}

          {/* Timestamp and Read Status */}
          {!onlyVoiceNoteAttachment && (
          <div
            className={cn(
              "flex items-center justify-end gap-1 mt-1 select-none",
              isSelf ? "text-white/75" : "text-muted-foreground"
            )}
          >
            <span className="text-[10px]">{formatTime(message.createdAt)}</span>
            <MessageStatusIndicator message={message} isSelf={isSelf} />
          </div>
        )}

        {/* Emoji Reactions Tray on Bubble */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 -mb-1">
            {reactions.map((emoji, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-xs bg-card/80 border border-border/80 rounded-full px-1.5 py-0.5 shadow-xs"
              >
                {emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  </div>
  );
}

