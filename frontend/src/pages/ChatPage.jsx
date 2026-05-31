import { Loader2, Paperclip, Send, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AudioPlayer } from "../components/AudioPlayer";
import { Button } from "../components/Button";
import { FileAttachment } from "../components/FileAttachment";
import { VoiceRecorder } from "../components/VoiceRecorder";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { api } from "../services/api";
import { formatBytes, shortDate } from "../utils/format";
import { CHAT_FILE_TYPES, MAX_CHAT_FILE_BYTES, validateFiles } from "../utils/upload";

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [attachError, setAttachError] = useState("");
  const [attachProgress, setAttachProgress] = useState(0);
  const [attaching, setAttaching] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  const selectedChat = useMemo(() => chats.find((chat) => chat._id === chatId), [chats, chatId]);
  const peer = selectedChat?.participants.find((participant) => participant._id !== user._id);

  useEffect(() => {
    const loadChats = async () => {
      const { data } = await api.get("/chats");
      setChats(data);
      if (!chatId && data[0]) navigate(`/chat/${data[0]._id}`, { replace: true });
    };
    loadChats();
  }, []);

  useEffect(() => {
    if (!chatId || !socket) return undefined;

    socket.emit("chat:join", chatId);
    const loadMessages = async () => {
      const { data } = await api.get(`/chats/${chatId}/messages`);
      setMessages(data);
    };
    loadMessages();

    const handleNewMessage = (message) => {
      if (message.chat === chatId) setMessages((current) => [...current, message]);
    };

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [chatId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (event) => {
    event.preventDefault();
    if (!content.trim() || !peer || !socket) return;

    socket.emit("message:send", { chatId, receiverId: peer._id, content }, (response) => {
      if (response?.ok) setContent("");
    });
  };

  // Emits an already-uploaded voice clip; resolves once the server acks so the
  // recorder can clear its preview. The new message arrives via "message:new".
  const sendVoice = (audio) =>
    new Promise((resolve, reject) => {
      if (!peer || !socket) return reject(new Error("Not connected"));
      socket.emit("message:send", { chatId, receiverId: peer._id, type: "voice", audio }, (response) => {
        if (response?.ok) resolve(response.message);
        else reject(new Error(response?.message || "Failed to send voice message"));
      });
    });

  // Validate a selected/dropped file and stage it for preview before sending.
  const stageFile = (fileList) => {
    setAttachError("");
    const { valid, errors } = validateFiles(fileList, {
      allowed: CHAT_FILE_TYPES,
      maxBytes: MAX_CHAT_FILE_BYTES,
      maxCount: 1
    });
    if (errors.length) setAttachError(errors[0]);
    if (valid[0]) setPendingFile(valid[0]);
  };

  // Upload the staged file, then broadcast it as a "file" message over the socket.
  const sendAttachment = async () => {
    if (!pendingFile || !peer || !socket) return;
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
      await new Promise((resolve, reject) => {
        socket.emit("message:send", { chatId, receiverId: peer._id, type: "file", file: data }, (response) => {
          if (response?.ok) resolve();
          else reject(new Error(response?.message || "Failed to send file"));
        });
      });
      setPendingFile(null);
    } catch (err) {
      setAttachError(err.response?.data?.message || err.message || "Failed to send file");
    } finally {
      setAttaching(false);
      setAttachProgress(0);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer.files?.length) stageFile(event.dataTransfer.files);
  };

  return (
    <main className="mx-auto grid h-[calc(100vh-76px)] max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[22rem_1fr]">
      <aside className="premium-card overflow-hidden rounded-2xl shadow-sm">
        <div className="border-b border-line/50 p-4">
          <h1 className="text-xl font-extrabold text-content">Chats</h1>
        </div>
        <div className="scrollbar-thin max-h-[calc(100vh-150px)] overflow-y-auto">
          {chats.map((chat) => {
            const participant = chat.participants.find((item) => item._id !== user._id);
            const isOnline = onlineUsers.includes(participant?._id);
            return (
              <button
                key={chat._id}
                onClick={() => navigate(`/chat/${chat._id}`)}
                className={`flex w-full items-center gap-3 border-b border-line p-4 text-left transition hover:bg-surface-2/70 ${chat._id === chatId ? "bg-surface-2" : ""}`}
              >
                <span className="relative">
                  <img
                    src={participant?.profileImage?.url || `https://ui-avatars.com/api/?name=${participant?.name || "User"}&background=3f6f5a&color=fff`}
                    alt={participant?.name}
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                  <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-line ${isOnline ? "bg-emerald-500" : "bg-slate-500"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-content">{participant?.name}</span>
                  <span className="block truncate text-sm text-muted">{chat.project?.title || "Direct chat"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="premium-card flex min-h-0 flex-col rounded-2xl shadow-sm">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between border-b border-line/50 p-4">
              <div>
                <h2 className="font-extrabold text-content">{peer?.name}</h2>
                <p className="text-sm text-muted">{onlineUsers.includes(peer?._id) ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div
              className="scrollbar-thin relative flex-1 space-y-4 overflow-y-auto bg-surface-deep/40 p-4"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              {dragOver && (
                <div className="pointer-events-none absolute inset-3 z-10 grid place-items-center rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
                  <p className="flex items-center gap-2 font-bold text-accent"><Upload className="h-5 w-5" /> Drop file to send</p>
                </div>
              )}
              {messages.map((message) => {
                const mine = message.sender?._id === user._id || message.sender === user._id;
                return (
                  <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-brand-gradient text-white" : "bg-surface-2 text-content"}`}>
                      {message.type === "voice" ? (
                        <AudioPlayer
                          src={message.audio?.url}
                          duration={message.audio?.duration}
                          variant={mine ? "mine" : "theirs"}
                        />
                      ) : message.type === "file" ? (
                        <FileAttachment file={message.file} mine={mine} />
                      ) : (
                        <p className="text-sm leading-6">{message.content}</p>
                      )}
                      <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>{shortDate(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              {typing && <p className="text-xs text-muted">Typing...</p>}
              <div ref={bottomRef} />
            </div>
            {/* Staged attachment preview */}
            {pendingFile && (
              <div className="border-t border-line/50 px-4 pt-3">
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
                  <Paperclip className="h-4 w-4 flex-shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-content">{pendingFile.name}</p>
                    <p className="text-xs text-muted">{formatBytes(pendingFile.size)}</p>
                    {attaching && (
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${attachProgress}%` }} />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={sendAttachment}
                    disabled={attaching}
                    aria-label="Send file"
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-brand-gradient text-white shadow-glow disabled:opacity-60"
                  >
                    {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    disabled={attaching}
                    aria-label="Discard file"
                    className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-muted hover:text-red-400 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
            {attachError && <p className="px-4 pt-2 text-xs font-semibold text-red-400">{attachError}</p>}

            <form onSubmit={send} className="flex flex-wrap items-center gap-3 border-t border-line/50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => {
                  stageFile(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!peer || !socket}
                aria-label="Attach file"
                className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-xl border border-line-strong bg-surface text-muted transition hover:border-primary hover:text-accent disabled:opacity-50"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <input
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  setTyping(Boolean(event.target.value));
                }}
                className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 py-3 text-content outline-none focus:border-primary"
                placeholder="Write a message"
              />
              <Button className="px-4 py-3"><Send className="h-4 w-4" /> Send</Button>
              <VoiceRecorder chatId={chatId} onSend={sendVoice} disabled={!peer || !socket} />
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-muted">Select a chat to start messaging.</div>
        )}
      </section>
    </main>
  );
};
