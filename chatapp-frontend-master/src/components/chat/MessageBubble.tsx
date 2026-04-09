import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime, fileFormat } from "@/lib/features";
import type { Message } from "@/store/appStore";
import VoiceMessage from "./VoiceMessage";
import { motion } from "framer-motion";
import { Download, FileText, Music, Video, ZoomIn } from "lucide-react";

interface Props {
  message: Message;
  isSelf: boolean;
  showName?: boolean;
}

const NAME_COLORS = [
  "text-emerald-500", "text-sky-500", "text-violet-500",
  "text-amber-500", "text-rose-500", "text-cyan-500", "text-indigo-500",
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
function ImageAttachment({ url, isSelf }: { url: string; isSelf: boolean }) {
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
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
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

function AudioAttachment({ url, isSelf, time }: { url: string; isSelf: boolean; time: string }) {
  // Voice notes get the fancy player; other audio files get the compact one
  if (isVoiceNote(url)) {
    return (
      <VoiceMessage
        audioUrl={url}
        msg={{
          from: isSelf ? "me" : "other",
          time,
          waveform: VOICE_WAVEFORM_BAR_HEIGHTS,
        }}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2 rounded-xl px-3 py-2 max-w-[260px]",
      isSelf ? "bg-black/10" : "bg-black/5"
    )}>
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isSelf ? "bg-primary/20" : "bg-muted"
      )}>
        <Music className="w-4 h-4 text-primary" />
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
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
        isSelf ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
      )}>
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

function Attachment({ url, isSelf, time }: { url: string; isSelf: boolean; time: string }) {
  const type = fileFormat(url);
  if (type === "image") return <ImageAttachment url={url} isSelf={isSelf} />;
  if (type === "video") return <VideoAttachment url={url} />;
  if (type === "audio") return <AudioAttachment url={url} isSelf={isSelf} time={time} />;
  // webm/ogg uploaded as voice notes won't match "audio" via extension check — detect manually
  const fname = getFileName(url).toLowerCase();
  if (fname.endsWith(".webm") || fname.endsWith(".ogg")) {
    return (
      <VoiceMessage
        audioUrl={url}
        msg={{
          from: isSelf ? "me" : "other",
          time,
          waveform: VOICE_WAVEFORM_BAR_HEIGHTS,
        }}
      />
    );
  }
  return <FileAttachment url={url} isSelf={isSelf} />;
}

export default function MessageBubble({ message, isSelf, showName }: Props) {
  if (message.sender.name === "Admin") {
    return (
      <div className="flex justify-center my-1">
        <span className="bg-accent text-muted-foreground text-xs px-3 py-1 rounded-lg">
          {message.content}
        </span>
      </div>
    );
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn("flex", isSelf ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[75%] md:max-w-[65%] relative",
          hasAttachments && !message.content
            ? ""
            : cn(
                "px-3.5 py-2",
                isSelf
                  ? "bg-chat-bubble-sent text-chat-bubble-sent-fg rounded-2xl rounded-br-sm"
                  : "bg-chat-bubble-received text-chat-bubble-received-fg rounded-2xl rounded-bl-sm shadow-sm"
              )
        )}
      >
        {showName && !isSelf && message.sender.name !== "Admin" && (
          <p className={cn("text-xs font-semibold mb-1", getNameColor(message.sender.name))}>
            {message.sender.name}
          </p>
        )}

        {hasAttachments && (
          <div className={cn("space-y-1.5", message.content ? "mb-2" : "")}>
            {message.attachments!.map((att, i) => (
              <Attachment key={i} url={att.url} isSelf={isSelf} time={formatTime(message.createdAt)} />
            ))}
          </div>
        )}

        {message.content && (
          <p className="text-sm leading-relaxed break-words">{message.content}</p>
        )}

        <span className={cn(
          "text-[10px] float-right mt-1 ml-3",
          isSelf ? "text-primary/60" : "text-muted-foreground"
        )}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.div>
  );
}
