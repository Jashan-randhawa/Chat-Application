import { useRef, useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import { sendAttachments } from "@/services/api";
import { useAppStore, type Message } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import {
  Send,
  Paperclip,
  X,
  Image,
  FileText,
  Music,
  Video,
  Smile,
  Reply,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fileFormat } from "@/lib/features";
import { encodeReplyMessage, getMessageSnippet } from "@/lib/replyUtils";
import VoiceRecorder from "./VoiceRecorder";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  chatId: string;
  members?: string[];
  replyTo?: Message | null;
  onCancelReply?: () => void;
}

interface PendingFile {
  file: File;
  previewUrl: string | null;
  type: "image" | "video" | "audio" | "file";
}

function fileIcon(type: PendingFile["type"]) {
  if (type === "image") return <Image className="h-4 w-4 text-emerald-500" />;
  if (type === "video") return <Video className="h-4 w-4 text-sky-500" />;
  if (type === "audio") return <Music className="h-4 w-4 text-violet-500" />;
  return <FileText className="h-4 w-4 text-amber-500" />;
}

function buildPending(file: File): PendingFile {
  const type = fileFormat(file.name) as PendingFile["type"];
  const previewUrl = type === "image" ? URL.createObjectURL(file) : null;
  return { file, previewUrl, type };
}

const COMMON_EMOJIS = [
  "😀", "😂", "😍", "👍", "🔥", "🎉", "❤️", "🙏",
  "😎", "🥳", "✨", "💯", "🤔", "👏", "🚀", "👌",
  "😭", "🥺", "😊", "🤩", "🙌", "💪", "💡", "☕",
];

export default function ChatInput({ chatId, replyTo, onCancelReply }: Props) {
  const socket = useSocket();
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typing state
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingActiveRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    if (!socket || !chatId) return;

    if (!isTypingActiveRef.current) {
      socket.emit(EVENTS.START_TYPING, { chatId });
      isTypingActiveRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit(EVENTS.STOP_TYPING, { chatId });
      isTypingActiveRef.current = false;
    }, 2500);
  };

  const stopTypingNow = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingActiveRef.current && socket && chatId) {
      socket.emit(EVENTS.STOP_TYPING, { chatId });
      isTypingActiveRef.current = false;
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (pendingFiles.length + files.length > 5) {
      toast.error("Max 5 files per message");
      return;
    }
    setPendingFiles((prev) => [...prev, ...files.map(buildPending)]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Auto-focus input when replying
  useEffect(() => {
    if (replyTo) {
      inputRef.current?.focus();
    }
  }, [replyTo]);

  const handleSendText = (content: string) => {
    if (!content.trim() || !socket || !chatId) return;
    stopTypingNow();

    const trimmed = content.trim();
    const finalMessage = replyTo ? encodeReplyMessage(replyTo, trimmed) : trimmed;

    socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: finalMessage });
    onCancelReply?.();
  };

  const handleSendVoice = async (audio: Blob, duration: number, waveform: number[]) => {
    if (!chatId) return;
    setUploading(true);
    stopTypingNow();
    try {
      const ext = audio.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([audio], `voice_${Date.now()}.${ext}`, {
        type: audio.type || "audio/webm",
      });
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("files", file);
      await sendAttachments(formData);
      onCancelReply?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Voice note upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSendAttachments = async () => {
    const hasFiles = pendingFiles.length > 0;
    const hasText = text.trim().length > 0;
    if (!hasFiles && !hasText) return;

    if (!hasFiles && hasText) {
      handleSendText(text);
      setText("");
      return;
    }

    setUploading(true);
    stopTypingNow();
    try {
      const formData = new FormData();
      formData.append("chatId", chatId);

      if (hasText) {
        const trimmed = text.trim();
        const finalCaption = replyTo ? encodeReplyMessage(replyTo, trimmed) : trimmed;
        if (socket) {
          socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: finalCaption });
        }
      }

      pendingFiles.forEach((pf) => formData.append("files", pf.file));
      await sendAttachments(formData);

      pendingFiles.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
      setPendingFiles([]);
      setText("");
      onCancelReply?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send attachments");
    } finally {
      setUploading(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const replySnippet = replyTo ? getMessageSnippet(replyTo) : null;

  return (
    <div className="relative border-t border-border/60 bg-card/90 dark:bg-[#111622] backdrop-blur-xl select-none z-20">
      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilePick}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
      />

      {/* Floating Emoji Picker Popover */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-4 mb-2 p-2.5 bg-card/95 border border-border/80 rounded-2xl shadow-xl backdrop-blur-xl z-30 max-w-[280px]"
          >
            <div className="grid grid-cols-6 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => addEmoji(emoji)}
                  className="w-8 h-8 rounded-lg hover:bg-muted text-base flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp-Style Reply Docked Banner */}
      <AnimatePresence>
        {replyTo && replySnippet && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-b border-border/60 bg-muted/60 dark:bg-zinc-900/90"
          >
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3 overflow-hidden text-xs flex-1">
                <div className="w-1 self-stretch rounded-full bg-primary shrink-0" />
                <div className="truncate flex-1">
                  <div className="flex items-center gap-1.5">
                    <Reply className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-primary truncate">
                      {replyTo.sender?.name || "User"}
                    </span>
                  </div>
                  <p className="text-muted-foreground truncate text-[11px] mt-0.5">
                    {replySnippet.text}
                  </p>
                </div>
                {replySnippet.thumbnailUrl && (
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-border/60">
                    <img
                      src={replySnippet.thumbnailUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={onCancelReply}
                className="ml-2 p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer shrink-0"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Files Previews */}
      {pendingFiles.length > 0 && (
        <div className="scrollbar-none flex items-end gap-2 overflow-x-auto px-4 pb-1 pt-3">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="group relative shrink-0">
              {pf.type === "image" && pf.previewUrl ? (
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-primary/40 shadow-xs">
                  <img src={pf.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted text-muted-foreground shadow-xs">
                  {fileIcon(pf.type)}
                  <span className="w-full truncate px-1 text-center text-[9px] font-medium leading-tight">
                    {pf.file.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-90 shadow-sm hover:opacity-100 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Luxury Input Container */}
      <div className="px-3 py-2.5 md:px-6 md:py-3">
        <div className="flex items-center gap-1.5 bg-muted/50 dark:bg-zinc-900/60 border border-border/70 rounded-2xl p-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/25 shadow-xs">
          {/* Attachment button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40 cursor-pointer"
            title="Attach files (photos, audio, video, docs)"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={uploading}
            className="shrink-0 rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40 cursor-pointer"
            title="Insert emoji"
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (pendingFiles.length > 0) {
                  void handleSendAttachments();
                } else if (text.trim()) {
                  handleSendText(text);
                  setText("");
                }
              }
            }}
            placeholder={
              uploading
                ? "Uploading..."
                : pendingFiles.length > 0
                ? "Add a caption..."
                : "Type a message..."
            }
            disabled={uploading}
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground/70 text-foreground disabled:opacity-50"
          />

          {/* Action: Send button OR Voice Recorder */}
          {pendingFiles.length > 0 || text.trim() ? (
            <button
              onClick={() => {
                if (pendingFiles.length > 0) {
                  void handleSendAttachments();
                } else if (text.trim()) {
                  handleSendText(text);
                  setText("");
                }
              }}
              disabled={uploading}
              className={cn(
                "shrink-0 rounded-xl p-2.5 text-white transition-all shadow-sm active:scale-95 disabled:opacity-40 cursor-pointer",
                activeTheme.sendBtnClass
              )}
              title="Send"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          ) : (
            <VoiceRecorder
              disabled={uploading}
              onSend={(audio, duration, waveform) =>
                handleSendVoice(audio, duration, waveform)
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
