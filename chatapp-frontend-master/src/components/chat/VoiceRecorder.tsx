import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface VoiceRecorderProps {
  onSend: (audio: Blob, duration: number, waveform: number[]) => Promise<void> | void;
  onText: (text: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function VoiceRecorder({ onSend, onText, disabled = false, compact = false }: VoiceRecorderProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "recording" | "locked">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>([]);
  const [isMicDown, setIsMicDown] = useState(false);
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
    setIsMicDown(false);
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
        const sample = Math.random() * 0.85 + 0.1;
        samplesRef.current.push(sample);
        setLiveWave([...samplesRef.current].slice(-20));
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
            samplesRef.current.length > 3
              ? samplesRef.current.map((v) => Math.max(0.1, Math.min(1, v)))
              : Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.1);

          setSending(true);
          try {
            await onSend(blob, duration, waveform);
          } finally {
            setSending(false);
          }
        }

        resolve();
      };
      recorder.stop();
    });

    resetRecorderState();
  };

  useEffect(() => {
    const onUp = () => {
      if (isMicDown && state === "recording") {
        void stopRecording(false);
      }
    };

    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isMicDown, state]);

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
    const wrapperClass = compact ? "" : "border-t border-border bg-card px-3 py-2";
    return (
      <div className={wrapperClass}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void stopRecording(true)}
            disabled={sending}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent disabled:opacity-40"
          >
            ✕
          </button>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="w-10 text-sm text-foreground">{formatTime(elapsed)}</span>
          <div className="flex h-7 flex-1 items-end gap-1">
            {(liveWave.length > 0 ? liveWave : Array(10).fill(0.3)).map((h, i) => (
              <div key={i} className="w-1 rounded-sm bg-emerald-500" style={{ height: Math.round(h * 20 + 4) }} />
            ))}
          </div>
          {state === "recording" && (
            <button
              onClick={() => {
                setState("locked");
                setIsMicDown(false);
              }}
              className="rounded-full p-2 text-xs text-muted-foreground hover:bg-accent"
            >
              Lock
            </button>
          )}
          <button
            onClick={() => void stopRecording(false)}
            disabled={sending}
            className="rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-40"
          >
            {sending ? "…" : "➤"}
          </button>
        </div>
      </div>
    );
  }

  const wrapperClass = compact ? "" : "border-t border-border bg-card px-3 py-2";
  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && text.trim()) {
              e.preventDefault();
              onText(text.trim());
              setText("");
            }
          }}
          disabled={disabled || sending}
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none disabled:opacity-50"
        />
        {text.trim() ? (
          <button
            onClick={() => {
              onText(text.trim());
              setText("");
            }}
            disabled={disabled || sending}
            className="rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-40"
          >
            ➤
          </button>
        ) : (
          <button
            onMouseDown={() => {
              setIsMicDown(true);
              void startRecording();
            }}
            onTouchStart={() => {
              setIsMicDown(true);
              void startRecording();
            }}
            disabled={disabled || sending}
            className="rounded-full bg-primary p-3 text-primary-foreground disabled:opacity-40"
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
}
