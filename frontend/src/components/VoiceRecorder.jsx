import { Loader2, Mic, Send, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { AudioPlayer } from "./AudioPlayer";

const MAX_DURATION = 300; // seconds — must match backend MAX_VOICE_DURATION

const pickMimeType = () => {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  if (typeof MediaRecorder === "undefined") return "";
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

/**
 * Records a voice clip via the MediaRecorder API and hands a finished blob to
 * the parent. Flow: idle → recording → preview (play / delete / send).
 * Uploading is delegated through onSend, which resolves once the message is
 * broadcast over the socket.
 */
export const VoiceRecorder = ({ chatId, onSend, disabled }) => {
  const [status, setStatus] = useState("idle"); // idle | recording | preview | uploading
  const [elapsed, setElapsed] = useState(0);
  const [clip, setClip] = useState(null); // { blob, url, duration }
  const [error, setError] = useState("");

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const mimeRef = useRef("");
  // Mirror of `elapsed` so the recorder.onstop closure reads the latest value.
  const elapsedRef = useRef(0);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Clean up on unmount.
  useEffect(() => () => {
    stopTimer();
    releaseStream();
    if (clip?.url) URL.revokeObjectURL(clip.url);
  }, [clip]);

  const startRecording = async () => {
    setError("");
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = mimeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        setClip({ blob, url, duration: elapsedRef.current });
        setStatus("preview");
        releaseStream();
      };

      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      elapsedRef.current = 0;
      setStatus("recording");
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_DURATION) stopRecording();
      }, 1000);
    } catch {
      setError("Microphone access was denied.");
      releaseStream();
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  };

  const discard = () => {
    if (clip?.url) URL.revokeObjectURL(clip.url);
    setClip(null);
    setElapsed(0);
    elapsedRef.current = 0;
    setStatus("idle");
    setError("");
  };

  const cancelRecording = () => {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    releaseStream();
    chunksRef.current = [];
    discard();
  };

  const sendClip = async () => {
    if (!clip) return;
    setStatus("uploading");
    setError("");
    try {
      const extension = (mimeRef.current.split("/")[1] || "webm").split(";")[0];
      const formData = new FormData();
      formData.append("audio", clip.blob, `voice-${Date.now()}.${extension}`);
      formData.append("chatId", chatId);
      formData.append("duration", String(clip.duration || 1));

      const { data } = await api.post("/chats/voice", formData);
      await onSend(data); // parent emits the socket message
      discard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send voice message");
      setStatus("preview");
    }
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (status === "idle") {
    return (
      <div className="flex flex-col items-end">
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          aria-label="Record voice message"
          className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition hover:border-primary hover:text-accent disabled:opacity-50"
        >
          <Mic className="h-5 w-5" />
        </button>
        {error && <p className="mt-1 max-w-[12rem] text-right text-xs text-red-400">{error}</p>}
      </div>
    );
  }

  if (status === "recording") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5">
        <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
        <span className="font-mono text-sm font-bold text-content">{fmt(elapsed)}</span>
        <span className="text-xs text-muted">Recording…</span>
        <button type="button" onClick={cancelRecording} aria-label="Cancel" className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={stopRecording} aria-label="Stop recording" className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white hover:brightness-110">
          <Square className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // preview | uploading
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface px-3 py-2">
        <button
          type="button"
          onClick={discard}
          disabled={status === "uploading"}
          aria-label="Delete recording"
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-muted hover:text-red-400 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <AudioPlayer src={clip?.url} duration={clip?.duration} />
        <button
          type="button"
          onClick={sendClip}
          disabled={status === "uploading"}
          aria-label="Send voice message"
          className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow disabled:opacity-60"
        >
          {status === "uploading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="max-w-[16rem] text-right text-xs text-red-400">{error}</p>}
    </div>
  );
};
