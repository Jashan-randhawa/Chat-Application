import { useRef, useState, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import { sendAttachments } from "@/services/api";
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
import VoiceRecorder from "./VoiceRecorder";
import type { Message } from "@/store/appStore";

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

  const removeFile = (idx: number) => {
    setPendingFiles((prev) => {
      const next = [...prev];
      if (next[idx].previewUrl) URL.revokeObjectURL(next[idx].previewUrl!);
      next.splice(idx, 1);
      return next;
    });
  };

  const stopTypingNow = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingActiveRef.current && socket) {
      socket.emit(EVENTS.STOP_TYPING, { chatId });
      isTypingActiveRef.current = false;
    }
  };

  const handleSendText = (content: string) => {
    if (!socket || !content.trim()) return;
    stopTypingNow();

    // Format message if replying
    let finalMessage = content.trim();
    if (replyTo) {
      // Prepend or link reply context
      finalMessage = `[Replying to ${replyTo.sender.name}: "${replyTo.content.slice(0, 40)}${replyTo.content.length > 40 ? "..." : ""}"]\n${finalMessage}`;
    }

    socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: finalMessage });
    onCancelReply?.();
  };

  const handleSendVoice = async (audio: Blob) => {
    setUploading(true);
    stopTypingNow();
    try {
      const ext = audio.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([audio], `voice-note-${Date.now()}.${ext}`, {
        type: audio.type || "audio/webm",
      });
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("files", file);
      await sendAttachments(formData);
      onCancelReply?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
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

      // If user typed caption alongside files
      if (hasText) {
        let finalCaption = text.trim();
        if (replyTo) {
          finalCaption = `[Replying to ${replyTo.sender.name}: "${replyTo.content.slice(0, 40)}"]\n${finalCaption}`;
        }
        // If socket exists, we can also send caption text
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
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-border bg-card relative select-none">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilePick}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
      />

      {/* Floating Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 mb-2 p-3 bg-card border border-border rounded-2xl shadow-xl z-30 animate-fade-in w-72">
          <div className="flex items-center justify-between pb-2 border-b border-border/60 mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Quick Reactions & Emojis</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="text-base p-1 hover:bg-muted rounded-lg transition-transform hover:scale-125 flex items-center justify-center cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quoted Reply Banner */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/70 border-b border-border text-xs animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-foreground">Replying to {replyTo.sender.name}: </span>
              <span className="text-muted-foreground truncate">{replyTo.content || "Attachment"}</span>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

      {/* Main Input Row */}
      {pendingFiles.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-3 md:px-5 md:py-3.5">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
            title="Attach more files"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendAttachments();
              }
            }}
            placeholder={uploading ? "Uploading attachments…" : "Add a caption…"}
            disabled={uploading}
            className="flex-1 rounded-xl bg-muted/70 px-4 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />

          <button
            onClick={() => void handleSendAttachments()}
            disabled={uploading}
            className="shrink-0 rounded-xl gradient-primary p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40 shadow-xs btn-tactile cursor-pointer"
            title="Send files"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-2.5 md:px-5 md:py-3">
          {/* Attachment button */}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
            title="Attach images, videos, audio, or documents"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Emoji button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={uploading}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 cursor-pointer"
            title="Emojis"
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Input or Voice Recorder */}
          <div className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (text.trim()) {
                    handleSendText(text);
                    setText("");
                  }
                }
              }}
              placeholder="Type a message..."
              disabled={uploading}
              className="flex-1 rounded-xl bg-muted/60 px-4 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
            />

            {text.trim() ? (
              <button
                onClick={() => {
                  handleSendText(text);
                  setText("");
                }}
                disabled={uploading}
                className="shrink-0 rounded-xl gradient-primary p-2.5 text-white transition-opacity hover:opacity-90 disabled:opacity-40 shadow-xs btn-tactile cursor-pointer"
                title="Send Message"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <VoiceRecorder
                compact
                disabled={uploading}
                onText={(value) => handleSendText(value)}
                onSend={(audio) => handleSendVoice(audio)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

