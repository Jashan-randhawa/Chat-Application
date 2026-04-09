import { useEffect, useRef, useState } from "react";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

interface VoiceRecorderProps {
  onSend: (duration: number, waveform: number[]) => void;
  onText: (text: string) => void;
}

export default function VoiceRecorder({ onSend, onText }: VoiceRecorderProps) {
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "recording" | "locked">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveWave, setLiveWave] = useState<number[]>([]);
  const [isMicDown, setIsMicDown] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<number[]>([]);
  const elapsedRef = useRef(0);

  const startTimer = () => {
    elapsedRef.current = 0;
    samplesRef.current = [];
    setElapsed(0);
    setLiveWave([]);

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      const sample = Math.random() * 0.85 + 0.1;
      samplesRef.current.push(sample);
      setLiveWave([...samplesRef.current].slice(-20));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const sendVoice = () => {
    stopTimer();
    const duration = Math.max(1, elapsedRef.current);
    const waveform =
      samplesRef.current.length > 3
        ? samplesRef.current.map((v) => Math.max(0.1, Math.min(1, v)))
        : Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.1);

    onSend(duration, waveform);
    setState("idle");
    setElapsed(0);
    setLiveWave([]);
    setIsMicDown(false);
  };

  const cancel = () => {
    stopTimer();
    setState("idle");
    setElapsed(0);
    setLiveWave([]);
    setIsMicDown(false);
  };

  useEffect(() => {
    const onUp = () => {
      if (isMicDown && state === "recording") sendVoice();
    };

    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [isMicDown, state]);

  useEffect(() => () => stopTimer(), []);

  if (state !== "idle") {
    return (
      <div className="border-t border-border bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <button onClick={cancel} className="rounded-full p-2 text-muted-foreground hover:bg-accent">
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
          <button onClick={sendVoice} className="rounded-full bg-primary p-3 text-primary-foreground">
            ➤
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-card px-3 py-2">
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
          placeholder="Type a message..."
          className="flex-1 rounded-full bg-muted px-4 py-2 text-sm outline-none"
        />
        {text.trim() ? (
          <button
            onClick={() => {
              onText(text.trim());
              setText("");
            }}
            className="rounded-full bg-primary p-3 text-primary-foreground"
          >
            ➤
          </button>
        ) : (
          <button
            onMouseDown={() => {
              setIsMicDown(true);
              setState("recording");
              startTimer();
            }}
            onTouchStart={() => {
              setIsMicDown(true);
              setState("recording");
              startTimer();
            }}
            className="rounded-full bg-primary p-3 text-primary-foreground"
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
}
