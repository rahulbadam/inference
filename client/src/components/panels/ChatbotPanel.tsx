import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your AI Inference Lab assistant. Ask me anything about model inference, hardware optimization, deployment strategies, or anything else!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error: ${response.status}`);
      }

      const assistantContent = data.choices?.[0]?.message?.content ?? "";
      setMessages([
        ...newMessages,
        { role: "assistant", content: assistantContent },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to get response";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hi! I'm your AI Inference Lab assistant. Ask me anything about model inference, hardware optimization, deployment strategies, or anything else!",
      },
    ]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-accent-cyan" />
          <h2 className="text-xl font-bold text-text-primary">AI Assistant</h2>
        </div>
        <button
          onClick={clearChat}
          className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          title="Clear conversation"
        >
          Clear chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-accent-cyan/10 text-accent-cyan"
                  : "bg-accent-purple/10 text-accent-purple"
              }`}
            >
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-surface border border-border text-text-primary"
                  : "bg-accent-cyan/10 border border-accent-cyan/20 text-text-primary"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-surface border border-border rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-accent-cyan" />
              <span className="text-sm text-text-muted">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
              <X size={16} />
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about inference optimization, hardware, deployment..."
            rows={1}
            className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 resize-none min-h-[42px] max-h-[120px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={`h-[42px] w-[42px] rounded-lg flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? "bg-accent-cyan text-white hover:bg-accent-cyan/90"
                : "bg-surface text-text-muted cursor-not-allowed"
            }`}
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-text-muted mt-2 text-center">
          Powered by DeepSeek-V4-Pro via HuggingFace
        </p>
      </div>
    </div>
  );
}