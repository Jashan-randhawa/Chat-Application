import { useRef, useState } from "react";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import { sendAttachments } from "@/services/api";
import { Send, Paperclip, X, Image, FileText, Music, Video } from "lucide-react";
import { toast } from "sonner";
import { fileFormat } from "@/lib/features";
import VoiceRecorder from "./VoiceRecorder";

interface Props {
  chatId: string;
  members?: string[];
}

interface PendingFile {
  file: File;
  previewUrl: string | null;
  type: "image" | "video" | "audio" | "file";
}

function fileIcon(type: PendingFile["type"]) {
  if (type === "image") return <Image className="h-4 w-4" />;
  if (type === "video") return <Video className="h-4 w-4" />;
  if (type === "audio") return <Music className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function buildPending(file: File): PendingFile {
  const type = fileFormat(file.name) as PendingFile["type"];
  const previewUrl = type === "image" ? URL.createObjectURL(file) : null;
  return { file, previewUrl, type };
}

export default function ChatInput({ chatId }: Props) {
  const socket = useSocket();

  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleSendText = (content: string) => {
    if (!socket || !content.trim()) return;
    socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: content.trim() });
    socket.emit(EVENTS.STOP_TYPING, { chatId });
  };

  const handleSendVoice = async (audio: Blob) => {
    setUploading(true);
    try {
      const ext = audio.type.includes("ogg") ? "ogg" : "webm";
      const file = new File([audio], `voice-note-${Date.now()}.${ext}`, { type: audio.type || "audio/webm" });
      const formData = new FormData();
      formData.append("chatId", chatId);
      formData.append("files", file);
      await sendAttachments(formData);
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
    try {
      const formData = new FormData();
      formData.append("chatId", chatId);
      if (hasText && !socket) formData.append("content", text.trim());
      pendingFiles.forEach((pf) => formData.append("files", pf.file));
      await sendAttachments(formData);
      pendingFiles.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
      setPendingFiles([]);
      setText("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-t border-border bg-card">
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilePick}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
      />

      {pendingFiles.length > 0 && (
        <div className="scrollbar-none flex items-end gap-2 overflow-x-auto px-3 pb-1 pt-3">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="group relative shrink-0">
              {pf.type === "image" && pf.previewUrl ? (
                <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-primary/30">
                  <img src={pf.previewUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-border bg-muted text-muted-foreground">
                  {fileIcon(pf.type)}
                  <span className="w-full truncate px-1 text-center text-[9px] font-medium leading-tight">
                    {pf.file.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {pendingFiles.length > 0 ? (
        <div className="flex items-center gap-2 px-3 py-3 md:px-5 md:py-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendAttachments();
              }
            }}
            placeholder={uploading ? "Uploading…" : "Add a caption…"}
            disabled={uploading}
            className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={() => void handleSendAttachments()}
            disabled={uploading}
            className="shrink-0 rounded-full bg-primary p-2.5 text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-3 md:px-5 md:py-4">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <VoiceRecorder
              compact
              disabled={uploading}
              onText={(value) => handleSendText(value)}
              onSend={(audio) => handleSendVoice(audio)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
