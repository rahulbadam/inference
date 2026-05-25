import { useState, useRef, useEffect } from "react";
import { Send, X, Bot, User, Loader2, MessageCircle } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      textareaRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

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
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-accent-cyan text-white shadow-lg shadow-accent-cyan/25 flex items-center justify-center hover:bg-accent-cyan/90 hover:scale-105 transition-all duration-200 group"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-purple rounded-full border-2 border-background animate-pulse" />
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-surface border border-border rounded-2xl shadow-2xl shadow-black/30 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">AI Assistant</h3>
                <p className="text-[10px] text-text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors text-xs"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-hover transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                    msg.role === "assistant"
                      ? "bg-accent-cyan/10 text-accent-cyan"
                      : "bg-accent-purple/10 text-accent-purple"
                  }`}
                >
                  {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "assistant"
                      ? "bg-background border border-border text-text-primary"
                      : "bg-accent-cyan/10 border border-accent-cyan/20 text-text-primary"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-md bg-accent-cyan/10 text-accent-cyan flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
                <div className="bg-background border border-border rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-accent-cyan" />
                  <span className="text-xs text-text-muted">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-md bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                  <X size={14} />
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-background/50">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 resize-none min-h-[36px] max-h-[80px]"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className={`h-[36px] w-[36px] rounded-lg flex items-center justify-center transition-all ${
                  input.trim() && !loading
                    ? "bg-accent-cyan text-white hover:bg-accent-cyan/90"
                    : "bg-surface text-text-muted cursor-not-allowed"
                }`}
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
            <p className="text-[9px] text-text-muted/60 mt-1.5 text-center">
              Powered by Llama 3.1 via HuggingFace
            </p>
          </div>
        </div>
      )}
    </>
  );
}