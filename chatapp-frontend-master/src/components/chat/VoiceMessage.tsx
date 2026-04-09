import { useEffect, useRef, useState, type MouseEvent } from "react";

interface VoiceMessageProps {
  msg: {
    from: "me" | "other";
    time: string;
    duration?: number;
    waveform?: number[];
  };
  audioUrl: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function Waveform({
  waveform,
  progress,
  isOwn,
  onSeek,
}: {
  waveform: number[];
  progress: number;
  isOwn: boolean;
  onSeek: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const value = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, value)));
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="flex h-8 flex-1 cursor-pointer select-none items-center gap-[2.5px]"
    >
      {waveform.map((h, i) => (
        <div
          key={`${i}-${h}`}
          className="w-[3px] shrink-0 rounded-sm transition-colors duration-75"
          style={{
            height: Math.round(h * 26 + 4),
            background:
              i / waveform.length <= progress
                ? "#fff"
                : isOwn
                  ? "rgba(255,255,255,0.35)"
                  : "rgba(255,255,255,0.28)",
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceMessage({ msg, audioUrl }: VoiceMessageProps) {
  const isOwn = msg.from === "me";
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(msg.duration ?? 0);

  const waveform = msg.waveform ?? Array(40).fill(0.45);
  const progress = duration > 0 ? elapsed / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (!msg.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setElapsed(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setElapsed(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [msg.duration]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = value * duration;
    setElapsed(audio.currentTime);
  };

  return (
    <div
      className="min-w-[220px] max-w-[300px] px-3 pb-1.5 pt-2 shadow-sm"
      style={{
        backgroundColor: isOwn ? "#005C4B" : "#202C33",
        borderRadius: isOwn ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
      }}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center gap-2.5">
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-none text-white transition-opacity hover:opacity-90"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="1.5" y="1" width="4" height="12" rx="1.5" />
              <rect x="8.5" y="1" width="4" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M2.5 1.5l10 5.5-10 5.5z" />
            </svg>
          )}
        </button>

        <Waveform waveform={waveform} progress={progress} isOwn={isOwn} onSeek={handleSeek} />
      </div>

      <div className="mt-1 flex justify-between px-0.5">
        <span className="text-[11px]" style={{ color: "rgba(233,237,239,0.6)" }}>
          {formatDuration(playing || elapsed > 0 ? elapsed : duration)}
        </span>
        <span className="text-[11px]" style={{ color: "rgba(233,237,239,0.6)" }}>
          {msg.time}
        </span>
      </div>
    </div>
  );
}
