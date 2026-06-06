import { motion } from "framer-motion";
import { ArrowLeft, CheckCheck, Loader2, MessagesSquare, Paperclip, Send, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AudioPlayer } from "../components/AudioPlayer";
import { Button } from "../components/Button";
import { FileAttachment } from "../components/FileAttachment";
import { VoiceRecorder } from "../components/VoiceRecorder";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { cn } from "../lib/cn";
import { api } from "../services/api";
import { formatBytes, shortDate } from "../utils/format";
import { CHAT_FILE_TYPES, MAX_CHAT_FILE_BYTES, validateFiles } from "../utils/upload";

const dayLabel = (value) => {
  const d = new Date(value);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(d);
};

const TypingDots = () => (
  <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-subtle"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [peerTyping, setPeerTyping] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [attachError, setAttachError] = useState("");
  const [attachProgress, setAttachProgress] = useState(0);
  const [attaching, setAttaching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);

  const selectedChat = useMemo(() => chats.find((chat) => chat._id === chatId), [chats, chatId]);
  const peer = selectedChat?.participants.find((participant) => participant._id !== user._id);
  const peerOnline = onlineUsers.includes(peer?._id);

  useEffect(() => {
    const loadChats = async () => {
      const { data } = await api.get("/chats");
      setChats(data);
      // Auto-open the first chat only on desktop, so mobile keeps the list view.
      if (!chatId && data[0] && window.matchMedia("(min-width: 1024px)").matches) {
        navigate(`/chat/${data[0]._id}`, { replace: true });
      }
    };
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMessage = (message) =>
    setMessages((current) => (current.some((m) => m._id === message._id) ? current : [...current, message]));

  useEffect(() => {
    if (!chatId) return undefined;
    if (socket) socket.emit("chat:join", chatId);

    const loadMessages = async () => {
      const { data } = await api.get(`/chats/${chatId}/messages`);
      setMessages(data);
    };
    loadMessages();

    const handleNewMessage = (message) => {
      if (message.chat === chatId) addMessage(message);
    };
    // Best-effort peer typing indicator — harmless if the server never emits it.
    const handleTyping = (payload) => {
      if (payload?.chatId === chatId && payload?.userId && payload.userId !== user._id) {
        setPeerTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setPeerTyping(false), 2500);
      }
    };
    socket?.on("message:new", handleNewMessage);
    socket?.on("chat:typing", handleTyping);

    const poll = setInterval(() => {
      if (!socket?.connected) loadMessages();
    }, 4000);

    return () => {
      socket?.off("message:new", handleNewMessage);
      socket?.off("chat:typing", handleTyping);
      clearInterval(poll);
      setPeerTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, peerTyping]);

  const send = async (event) => {
    event.preventDefault();
    if (!content.trim() || !peer) return;
    const text = content;
    setContent("");
    try {
      const { data } = await api.post(`/chats/${chatId}/messages`, { content: text });
      addMessage(data);
    } catch {
      setContent(text);
    }
  };

  const sendVoice = async (audio) => {
    if (!peer) throw new Error("Not connected");
    const { data } = await api.post(`/chats/${chatId}/messages`, { type: "voice", audio });
    addMessage(data);
    return data;
  };

  const stageFile = (fileList) => {
    setAttachError("");
    const { valid, errors } = validateFiles(fileList, { allowed: CHAT_FILE_TYPES, maxBytes: MAX_CHAT_FILE_BYTES, maxCount: 1 });
    if (errors.length) setAttachError(errors[0]);
    if (valid[0]) setPendingFile(valid[0]);
  };

  const sendAttachment = async () => {
    if (!pendingFile || !peer) return;
    setAttaching(true);
    setAttachError("");
    setAttachProgress(0);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile);
      formData.append("chatId", chatId);
      const { data } = await api.post("/chats/attachment", formData, {
        onUploadProgress: (event) => {
          if (event.total) setAttachProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      const { data: message } = await api.post(`/chats/${chatId}/messages`, { type: "file", file: data });
      addMessage(message);
      setPendingFile(null);
    } catch (err) {
      setAttachError(err.response?.data?.message || err.message || "Failed to send file");
    } finally {
      setAttaching(false);
      setAttachProgress(0);
    }
  };

  const onInput = (event) => {
    setContent(event.target.value);
    if (socket && chatId) socket.emit("chat:typing", { chatId, userId: user._id });
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) stageFile(event.dataTransfer.files);
  };

  return (
    <div className="mx-auto h-[78vh] min-h-[30rem] w-full max-w-7xl px-3 py-4 sm:px-4 lg:py-6">
      <div className="grid h-full gap-4 lg:grid-cols-[22rem_1fr]">
        {/* Conversation list */}
        <aside className={cn("premium-card flex min-h-0 flex-col overflow-hidden rounded-2xl", chatId && "hidden lg:flex")}>
          <div className="flex items-center gap-2 border-b border-line p-4">
            <MessagesSquare className="h-5 w-5 text-brand" />
            <h1 className="text-lg font-bold text-content">Messages</h1>
            <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-xs font-bold text-muted">{chats.length}</span>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            {chats.map((chat) => {
              const participant = chat.participants.find((item) => item._id !== user._id);
              const isOnline = onlineUsers.includes(participant?._id);
              const active = chat._id === chatId;
              return (
                <button
                  key={chat._id}
                  onClick={() => navigate(`/chat/${chat._id}`)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-line/60 p-3.5 text-left transition hover:bg-surface-2/70",
                    active && "bg-brand/5"
                  )}
                >
                  <Avatar src={participant?.profileImage?.url} name={participant?.name} size="md" status={isOnline ? "online" : undefined} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-content">{participant?.name}</span>
                    <span className="block truncate text-sm text-muted">{chat.lastMessage?.content || chat.project?.title || "Direct chat"}</span>
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-brand" />}
                </button>
              );
            })}
            {!chats.length && <p className="p-6 text-center text-sm text-subtle">No conversations yet.</p>}
          </div>
        </aside>

        {/* Thread */}
        <section className={cn("premium-card flex min-h-0 flex-col overflow-hidden rounded-2xl", !chatId && "hidden lg:flex")}>
          {selectedChat ? (
            <>
              <div className="flex items-center gap-3 border-b border-line p-3.5">
                <button onClick={() => navigate("/chat")} aria-label="Back" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 lg:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar src={peer?.profileImage?.url} name={peer?.name} size="sm" status={peerOnline ? "online" : undefined} />
                <div className="min-w-0">
                  <h2 className="truncate font-bold text-content">{peer?.name}</h2>
                  <p className={cn("text-xs font-medium", peerOnline ? "text-success" : "text-subtle")}>
                    {peerOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div
                className="scrollbar-thin relative min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-surface-2/30 p-4"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
              >
                {dragOver && (
                  <div className="pointer-events-none absolute inset-3 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-brand bg-brand/10 backdrop-blur-sm">
                    <p className="flex items-center gap-2 font-bold text-brand"><Upload className="h-5 w-5" /> Drop file to send</p>
                  </div>
                )}
                {messages.map((message, i) => {
                  const mine = message.sender?._id === user._id || message.sender === user._id;
                  const prev = messages[i - 1];
                  const showDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
                  return (
                    <div key={message._id}>
                      {showDay && (
                        <div className="my-3 flex justify-center">
                          <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-subtle shadow-xs">{dayLabel(message.createdAt)}</span>
                        </div>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("flex", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-xs",
                            mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface text-content"
                          )}
                        >
                          {message.type === "voice" ? (
                            <AudioPlayer src={message.audio?.url} duration={message.audio?.duration} variant={mine ? "mine" : "theirs"} />
                          ) : message.type === "file" ? (
                            <FileAttachment file={message.file} mine={mine} />
                          ) : (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                          )}
                          <p className={cn("mt-1 flex items-center justify-end gap-1 text-[11px]", mine ? "text-white/70" : "text-subtle")}>
                            {shortDate(message.createdAt)}
                            {mine && <CheckCheck className="h-3.5 w-3.5" />}
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                {peerTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start pt-1">
                    <TypingDots />
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {pendingFile && (
                <div className="border-t border-line px-4 pt-3">
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
                    <Paperclip className="h-4 w-4 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-content">{pendingFile.name}</p>
                      <p className="text-xs text-muted">{formatBytes(pendingFile.size)}</p>
                      {attaching && (
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${attachProgress}%` }} />
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={sendAttachment} disabled={attaching} aria-label="Send file" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand text-white shadow-glow-sm disabled:opacity-60">
                      {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => setPendingFile(null)} disabled={attaching} aria-label="Discard file" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:text-brand disabled:opacity-50">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              {attachError && <p className="px-4 pt-2 text-xs font-semibold text-brand">{attachError}</p>}

              <form onSubmit={send} className="flex items-center gap-2 border-t border-line p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(e) => { stageFile(e.target.files); e.target.value = ""; }}
                />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!peer} aria-label="Attach file" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition hover:border-brand/40 hover:text-brand disabled:opacity-50">
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  value={content}
                  onChange={onInput}
                  className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 py-3 text-content outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
                  placeholder="Write a message…"
                />
                <Button type="submit" size="icon" className="h-11 w-11 shrink-0" aria-label="Send"><Send className="h-5 w-5" /></Button>
                <VoiceRecorder chatId={chatId} onSend={sendVoice} disabled={!peer} />
              </form>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8">
              <EmptyState icon={MessagesSquare} title="Select a conversation" description="Choose a chat from the list to start messaging." className="border-0 bg-transparent shadow-none" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
