import { useState, useEffect, useRef } from "react";
import { apiClient } from "../services/apiClient";
import { PlusIcon, Loader } from "../utils/Icons";

const ChatInterface = ({ chat, onFileUploaded }) => {
  // State & refs
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-focus on mount

  const activeChatId = chat?.id;

  useEffect(() => {
    if (activeChatId && chat?.file_url && !loading) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [activeChatId, chat?.file_url, loading]);

  // Fetch messages when chat changes
  useEffect(() => {
    if (!activeChatId || !chat?.file_url) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/messages/${activeChatId}`);
        setMessages(response.data || []);
      } catch (error) {
        setMessages([]);
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeChatId, chat?.file_url]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // File upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiClient.post(`/upload?chat_id=${chat.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onFileUploaded && onFileUploaded();
    } catch (error) {
      alert(
        "Upload failed: " + (error.response?.data?.detail || error.message)
      );
    } finally {
      setUploading(false);
    }
  };

  // Send message & get assistant reply
  const handleSend = async () => {
    if (!input.trim() || !activeChatId) return;

    const userMessageText = input.trim();
    setInput("");
    setLoadingReply(true);

    try {
      // Call backend which stores user msg, generates assistant msg, returns both
      const response = await apiClient.post("/messages", {
        chat_id: activeChatId,
        role: "user",
        content: userMessageText,
      });

      // Response is full updated list for this chat
      setMessages(response.data || []);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoadingReply(false);
    }
  };

  // ---- Conditional Renders ----

  // No chat selected
  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted">
        Select or create a chat to get started.
      </div>
    );
  }

  // Chat exists but no file uploaded
  if (!chat.file_url) {
    return (
      <div className="flex flex-1 items-center justify-center flex-col gap-3">
        {uploading ? (
          <div className="flex flex-col items-center justify-center text-brand-primary">
            <Loader />
            <div className="text-lg font-medium">Uploading...</div>
          </div>
        ) : (
          <>
            <button
              className="
                flex flex-col items-center justify-center
                bg-surface bg-opacity-60
                border border-border-primary
                rounded-3xl
                shadow-2xl
                w-[340px] h-[120px]
                backdrop-blur-md
                text-brand-primary
                hover:bg-brand-hover/30
                transition-all duration-200
                focus:outline-none
                active:scale-98
                mb-4
              "
              onClick={() =>
                fileInputRef.current && fileInputRef.current.click()
              }
              disabled={uploading}
            >
              <PlusIcon className="w-14 h-14 mb-2 text-brand-primary" />
              <span className="font-bold text-lg">Upload File</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.txt,.csv"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <div className="text-text-muted text-lg font-medium text-center max-w-md">
              Upload a PDF, TXT, or CSV file to start chatting.
            </div>
          </>
        )}
      </div>
    );
  }

  // Loading messages
  if (loading) {
    return (
      <div className="p-4 text-center text-text-muted">Loading messages...</div>
    );
  }

  // ---- Main Chat UI ----
  return (
    <div
      className="relative flex flex-col flex-1 w-full bg-surface p-18  shadow-2xl border border-border-primary backdrop-blur-sm overflow-y-auto"
      style={{ boxShadow: "0 8px 32px rgba(93, 95, 239, 0.3)" }}
    >
      <div className="flex-1 overflow-y-auto space-y-4 px-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`w-fit max-w-[90%] p-4 rounded-2xl break-words ${
              msg.role === "user"
                ? "ml-auto bg-brand-primary text-white shadow-shadow-action"
                : "mr-auto bg-surface-hover text-text-primary border border-border-primary"
            }`}
            style={{
              boxShadow:
                msg.role === "user"
                  ? "0 4px 12px var(--color-shadow-action)"
                  : "inset 0 0 10px var(--color-border-primary)",
            }}
          >
            {msg.content || msg.text}
          </div>
        ))}

        {/* Optional: Typing indicator */}
        {loadingReply && (
          <div
            className="w-fit max-w-[90%] mr-auto p-4 rounded-2xl bg-surface-hover text-text-primary border border-border-primary italic"
            style={{
              boxShadow: "inset 0 0 10px var(--color-border-primary)",
            }}
          >
            Assistant is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className=" mt-4 flex items-center space-x-4 rounded-3xl bg-surface px-5 py-3"
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border-primary)",
          boxShadow: `
      0 4px 10px rgba(0, 0, 0, 0.18),
      0 2px 4px rgba(0, 0, 0, 0.12),
      inset 0 1px 2px rgba(255, 255, 255, 0.3)
    `,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-transparent focus:outline-none text-text-primary placeholder-text-muted"
          disabled={loadingReply}
        />
        <button
          onClick={handleSend}
          disabled={loadingReply || !input.trim()}
          className="bg-brand-primary hover:bg-brand-hover text-white px-5 py-2 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-60"
          style={{
            boxShadow: `
        0 3px 6px rgba(0,0,0,0.2),
        inset 0 1px 0 rgba(255,255,255,0.2)
      `,
          }}
        >
          {loadingReply ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
