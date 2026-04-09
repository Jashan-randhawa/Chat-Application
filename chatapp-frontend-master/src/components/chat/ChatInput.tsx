import { useState, useRef, useEffect, useCallback } from "react";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import { sendAttachments } from "@/services/api";
import { Send, Paperclip, X, Image, FileText, Music, Video, Mic, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fileFormat } from "@/lib/features";
import { cn } from "@/lib/utils";

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
  if (type === "image") return <Image className="w-4 h-4" />;
  if (type === "video") return <Video className="w-4 h-4" />;
  if (type === "audio") return <Music className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

function buildPending(file: File): PendingFile {
  const type = fileFormat(file.name) as PendingFile["type"];
  const previewUrl = type === "image" ? URL.createObjectURL(file) : null;
  return { file, previewUrl, type };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function WaveformBars({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const bufLen = analyser.frequencyBinCount;
    const buf = new Uint8Array(bufLen);

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barW = 3;
      const gap = 2;
      const bars = Math.floor(canvas.width / (barW + gap));
      const step = Math.floor(bufLen / bars);
      for (let i = 0; i < bars; i++) {
        const val = buf[i * step] / 255;
        const h = Math.max(4, val * canvas.height);
        const x = i * (barW + gap);
        const y = (canvas.height - h) / 2;
        ctx.fillStyle = `rgba(34,197,94,${0.5 + val * 0.5})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, 2);
        ctx.fill();
      }
    };
    draw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={36}
      className="flex-1"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default function ChatInput({ chatId, members }: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const socket = useSocket();
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const fileRef = useRef<HTMLInputElement>(null);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [slidCancel, setSlidCancel] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const recordingRef = useRef(false);
  const startXRef = useRef(0);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => { if (voiceUrl) URL.revokeObjectURL(voiceUrl); };
  }, [voiceUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      source.connect(analyserNode);
      setAnalyser(analyserNode);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        audioCtxRef.current?.close();
        setAnalyser(null);

        if (cancelledRef.current) {
          setVoiceBlob(null);
          setVoiceUrl(null);
          cancelledRef.current = false;
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
      };

      mr.start(100);
      recordingRef.current = true;
      setRecording(true);
      setRecordSeconds(0);
      setSlidCancel(false);
      cancelledRef.current = false;

      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone permission denied");
    }
  }, []);

  const stopRecording = useCallback((cancel = false) => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    cancelledRef.current = cancel;
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setSlidCancel(false);
    if (cancel) setRecordSeconds(0);
  }, []);

  const handleMicPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    startRecording();
  }, [startRecording]);

  const handleMicPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!recordingRef.current) return;
    const dx = startXRef.current - e.clientX;
    setSlidCancel(dx > 80);
  }, []);

  const handleMicPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!recordingRef.current) return;
    const dx = startXRef.current - e.clientX;
    stopRecording(dx > 80);
  }, [stopRecording]);

  const discardVoice = () => {
    setVoiceBlob(null);
    if (voiceUrl) { URL.revokeObjectURL(voiceUrl); setVoiceUrl(null); }
    setRecordSeconds(0);
  };

  const sendVoiceNote = async () => {
    if (!voiceBlob) return;
    setUploading(true);
    const ext = voiceBlob.type.includes("webm") ? "webm" : "ogg";
    const file = new File([voiceBlob], `voice-note-${Date.now()}.${ext}`, { type: voiceBlob.type });
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("files", file);
    try {
      await sendAttachments(formData);
      discardVoice();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Upload failed");
    }
    setUploading(false);
  };

  const handleSend = async () => {
    const hasText = text.trim().length > 0;
    const hasFiles = pendingFiles.length > 0;
    if (!hasText && !hasFiles) return;

    if (hasFiles) {
      setUploading(true);
      const formData = new FormData();
      formData.append("chatId", chatId);
      if (hasText && !socket) formData.append("content", text.trim());
      pendingFiles.forEach((pf) => formData.append("files", pf.file));
      try {
        await sendAttachments(formData);
        setPendingFiles([]);
        pendingFiles.forEach((pf) => { if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl); });
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Upload failed");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (hasText && socket) {
      socket.emit(EVENTS.NEW_MESSAGE, { chatId, message: text.trim() });
      setText("");
      socket.emit(EVENTS.STOP_TYPING, { chatId });
    }
  };

  const handleTyping = (val: string) => {
    setText(val);
    if (!socket) return;
    socket.emit(EVENTS.START_TYPING, { chatId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit(EVENTS.STOP_TYPING, { chatId });
    }, 2000);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (pendingFiles.length + files.length > 5) { toast.error("Max 5 files per message"); return; }
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

  const canSend = (text.trim().length > 0 || pendingFiles.length > 0) && !uploading;
  const showMicButton = !voiceBlob && text.trim().length === 0 && pendingFiles.length === 0;

  // ── RECORDING UI ─────────────────────────────────────────────────────────
  if (recording) {
    return (
      <div className="bg-card border-t border-border select-none">
        <div className="flex items-center gap-3 px-3 py-3 md:px-5 md:py-4">
          <div
            className={cn(
              "flex-1 flex items-center gap-2 rounded-full px-4 py-2 transition-colors",
              slidCancel ? "bg-destructive/20" : "bg-muted"
            )}
          >
            {slidCancel ? (
              <span className="text-xs text-destructive font-medium flex-1 text-center">
                Release to cancel
              </span>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <WaveformBars analyser={analyser} />
                <span className="text-sm font-mono text-muted-foreground flex-shrink-0">
                  {formatDuration(recordSeconds)}
                </span>
                <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 hidden sm:block">
                  ← slide to cancel
                </span>
              </>
            )}
          </div>

          {/* Mic button — hold to record, release to send */}
          <button
            onPointerDown={handleMicPointerDown}
            onPointerMove={handleMicPointerMove}
            onPointerUp={handleMicPointerUp}
            onPointerCancel={() => stopRecording(true)}
            className={cn(
              "p-3 rounded-full text-white transition-all flex-shrink-0 touch-none",
              slidCancel
                ? "bg-destructive scale-95"
                : "bg-red-500 scale-110 shadow-lg shadow-red-500/40"
            )}
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-red-500/20 mx-3 mb-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(100, (recordSeconds / 120) * 100)}%` }}
          />
        </div>
      </div>
    );
  }

  // ── VOICE PREVIEW UI ──────────────────────────────────────────────────────
  if (voiceBlob && voiceUrl) {
    return (
      <div className="bg-card border-t border-border">
        <div className="flex items-center gap-3 px-3 py-3 md:px-5 md:py-4">
          <button
            onClick={discardVoice}
            className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
            title="Discard"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-muted rounded-full px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Mic className="w-3.5 h-3.5 text-primary" />
            </div>
            <audio
              src={voiceUrl}
              controls
              className="flex-1 h-8 min-w-0"
              style={{ accentColor: "hsl(var(--primary))" }}
            />
            <span className="text-xs text-muted-foreground flex-shrink-0 font-mono">
              {formatDuration(recordSeconds)}
            </span>
          </div>

          <button
            onClick={sendVoiceNote}
            disabled={uploading}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            title="Send voice note"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    );
  }

  // ── NORMAL INPUT UI ───────────────────────────────────────────────────────
  return (
    <div className="bg-card border-t border-border">
      {pendingFiles.length > 0 && (
        <div className="px-3 pt-3 flex items-end gap-2 overflow-x-auto scrollbar-none pb-1">
          {pendingFiles.map((pf, i) => (
            <div key={i} className="relative flex-shrink-0 group">
              {pf.type === "image" && pf.previewUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-primary/30">
                  <img src={pf.previewUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-border bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  {fileIcon(pf.type)}
                  <span className="text-[9px] font-medium text-center leading-tight px-1 truncate w-full text-center">
                    {pf.file.name.split(".").pop()?.toUpperCase()}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
              {uploading && (
                <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          ))}
          {pendingFiles.length < 5 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex-shrink-0 w-16 h-16 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 flex items-center justify-center text-primary/40 hover:text-primary/70 transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-3 md:px-5 md:py-4">
        {pendingFiles.length === 0 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFilePick}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.txt"
        />
        <input
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && canSend && handleSend()}
          placeholder={uploading ? "Uploading…" : pendingFiles.length > 0 ? "Add a caption…" : "Type a message…"}
          disabled={uploading}
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground transition-shadow disabled:opacity-50"
        />

        {showMicButton ? (
          /* WhatsApp-style hold-to-record mic button */
          <button
            onPointerDown={handleMicPointerDown}
            onPointerMove={handleMicPointerMove}
            onPointerUp={handleMicPointerUp}
            onPointerCancel={() => stopRecording(true)}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 active:scale-110 active:shadow-lg active:shadow-primary/40 transition-all flex-shrink-0 touch-none select-none"
            title="Hold to record · Slide left to cancel"
          >
            <Mic className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="p-2.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
          >
            {uploading
              ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        )}
      </div>

      {showMicButton && !uploading && (
        <p className="text-center text-[10px] text-muted-foreground pb-1 select-none pointer-events-none">
          Hold mic to record · slide ← to cancel
        </p>
      )}
    </div>
  );
}
