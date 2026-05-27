import { Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { api } from "../services/api";
import { shortDate } from "../utils/format";

export const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef(null);

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

  return (
    <main className="mx-auto grid h-[calc(100vh-76px)] max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[22rem_1fr]">
      <aside className="overflow-hidden rounded-lg border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 p-4">
          <h1 className="text-xl font-extrabold text-ink">Chats</h1>
        </div>
        <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
          {chats.map((chat) => {
            const participant = chat.participants.find((item) => item._id !== user._id);
            const isOnline = onlineUsers.includes(participant?._id);
            return (
              <button
                key={chat._id}
                onClick={() => navigate(`/chat/${chat._id}`)}
                className={`flex w-full items-center gap-3 border-b border-ink/5 p-4 text-left transition hover:bg-mist ${chat._id === chatId ? "bg-mist" : ""}`}
              >
                <span className="relative">
                  <img
                    src={participant?.profileImage?.url || `https://ui-avatars.com/api/?name=${participant?.name || "User"}&background=3f6f5a&color=fff`}
                    alt={participant?.name}
                    className="h-11 w-11 rounded-lg object-cover"
                  />
                  <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-ink/25"}`} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-ink">{participant?.name}</span>
                  <span className="block truncate text-sm text-ink/55">{chat.project?.title || "Direct chat"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-0 flex-col rounded-lg border border-ink/10 bg-white shadow-sm">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between border-b border-ink/10 p-4">
              <div>
                <h2 className="font-extrabold text-ink">{peer?.name}</h2>
                <p className="text-sm text-ink/55">{onlineUsers.includes(peer?._id) ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto bg-mist/50 p-4">
              {messages.map((message) => {
                const mine = message.sender?._id === user._id || message.sender === user._id;
                return (
                  <div key={message._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-lg px-4 py-3 shadow-sm ${mine ? "bg-ink text-white" : "bg-white text-ink"}`}>
                      <p className="text-sm leading-6">{message.content}</p>
                      <p className={`mt-1 text-[11px] ${mine ? "text-white/55" : "text-ink/45"}`}>{shortDate(message.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-3 border-t border-ink/10 p-4">
              <input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-ink/10 px-4 py-3 outline-none focus:border-moss"
                placeholder="Write a message"
              />
              <Button><Send className="h-4 w-4" /> Send</Button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-ink/55">Select a chat to start messaging.</div>
        )}
      </section>
    </main>
  );
};
