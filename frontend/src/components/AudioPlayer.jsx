import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

/**
 * Compact, modern audio player for voice messages.
 * Supports play/pause, seek (scrubbing), live time, and replay when finished.
 * `variant` flips colors so it reads on both the gradient ("mine") bubble and
 * the neutral surface ("theirs") bubble.
 */
export const AudioPlayer = ({ src, duration = 0, variant = "theirs" }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration || 0);
  const [ended, setEnded] = useState(false);

  const mine = variant === "mine";

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onLoaded = () => {
      // Some browsers report Infinity for streamed blobs; fall back to prop.
      if (Number.isFinite(audio.duration) && audio.duration > 0) setTotal(audio.duration);
    };
    const onTime = () => setCurrent(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setEnded(true);
      setCurrent(0);
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
      setEnded(false);
    }
  };

  const seek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;
    const value = Number(event.target.value);
    audio.currentTime = value;
    setCurrent(value);
  };

  const progressMax = total || duration || 0;
  const accentText = mine ? "text-white" : "text-content";
  const subText = mine ? "text-white/70" : "text-muted";
  const btnClass = mine
    ? "bg-white/20 text-white hover:bg-white/30"
    : "bg-primary text-white hover:brightness-110";

  return (
    <div className="flex min-w-[12rem] items-center gap-3">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : ended ? "Replay" : "Play"}
        className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full transition ${btnClass}`}
      >
        {playing ? <Pause className="h-4 w-4" /> : ended ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={progressMax || 1}
          step={0.1}
          value={current}
          onChange={seek}
          aria-label="Seek"
          className={`voice-seek h-1.5 w-full cursor-pointer appearance-none rounded-full ${mine ? "accent-white" : "accent-primary"}`}
          style={{
            background: (() => {
              const pct = progressMax ? (current / progressMax) * 100 : 0;
              const fill = mine ? "rgba(255,255,255,0.9)" : "rgb(37 99 235)";
              const track = mine ? "rgba(255,255,255,0.3)" : "rgb(var(--line-strong))";
              return `linear-gradient(to right, ${fill} 0%, ${fill} ${pct}%, ${track} ${pct}%, ${track} 100%)`;
            })()
          }}
        />
        <div className={`mt-1 flex justify-between text-[11px] font-semibold ${subText}`}>
          <span className={accentText}>{formatTime(current)}</span>
          <span>{formatTime(progressMax)}</span>
        </div>
      </div>
    </div>
  );
};
