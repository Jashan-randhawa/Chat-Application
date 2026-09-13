import { useEffect, useRef, useState } from "react";
import { Mic, Trash2, Send, Lock, Square } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface VoiceRecorderProps {
  onSend: (audio: Blob, duration: number, waveform: number[]) => Promise<void> | void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onSend, disabled = false }: VoiceRecorderProps) {
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  const [state, setState] = useState<"idle" | "recording" | "locked">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>([]);
  const [sending, setSending] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const elapsedRef = useRef(0);
  const samplesRef = useRef<number[]>([]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const resetRecorderState = () => {
    stopTimer();
    setState("idle");
    setElapsed(0);
    setLiveWave([]);
    elapsedRef.current = 0;
    samplesRef.current = [];
  };

  const startRecording = async () => {
    if (disabled || sending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      elapsedRef.current = 0;
      samplesRef.current = [];
      setElapsed(0);
      setLiveWave([]);
      setState("recording");

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(100);

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        const sample = Math.random() * 0.85 + 0.15;
        samplesRef.current.push(sample);
        setLiveWave([...samplesRef.current].slice(-24));
      }, 1000);
    } catch {
      resetRecorderState();
    }
  };

  const stopRecording = async (cancel = false) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    stopTimer();

    await new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (!cancel && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          const duration = Math.max(1, elapsedRef.current);
          const waveform =
            samplesRef.current.length > 0
              ? samplesRef.current
              : Array(24).fill(0.4);

          setSending(true);
          try {
            await onSend(blob, duration, waveform);
          } finally {
            setSending(false);
          }
        }
        resolve();
      };

      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        resolve();
      }
    });

    resetRecorderState();
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      resetRecorderState();
    };
  }, []);

  if (state !== "idle") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex items-center gap-3 w-full px-2 py-1 select-none"
      >
        {/* Cancel Recording */}
        <button
          onClick={() => void stopRecording(true)}
          disabled={sending}
          className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          title="Discard recording"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Live Recording Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
          <span className="font-mono text-xs font-semibold text-foreground tracking-tight w-10">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Live Waveform Display */}
        <div className="flex h-7 flex-1 items-center gap-0.5 px-2 overflow-hidden">
          {(liveWave.length > 0 ? liveWave : Array(16).fill(0.3)).map((h, i) => (
            <motion.div
              key={i}
              className={cn("w-1 rounded-full transition-all duration-100", activeTheme.dotColor)}
              style={{ height: Math.max(6, Math.round(h * 24)) }}
            />
          ))}
        </div>

        {/* Send voice recording */}
        <button
          onClick={() => void stopRecording(false)}
          disabled={sending}
          className={cn(
            "p-2.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95",
            activeTheme.sendBtnClass
          )}
          title="Send voice note"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </motion.div>
    );
  }

  return (
    <button
      onClick={() => void startRecording()}
      disabled={disabled || sending}
      className={cn(
        "p-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer text-white",
        activeTheme.sendBtnClass
      )}
      title="Record voice note"
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}
