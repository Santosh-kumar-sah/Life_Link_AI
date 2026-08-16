import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, Sparkles, User } from "lucide-react";
import { fetchClient } from "../utils/fetchClient";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_QUESTIONS = [
  "What are the travel limits for organs?",
  "How is HLA tissue matching calculated?",
  "What is the Safe Cold Ischemia Time?",
  "How do I upload verification documents?"
];

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your LifeLink AI Support Assistant. How can I help you today with organ matches, HLA typing, or verification?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      // Send message history to the backend API
      const res = await fetchClient<Message>("/api/v1/support/chat", {
        method: "POST",
        json: { messages: updatedMessages }
      });

      if (res && res.content) {
        setMessages((prev) => [...prev, res]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I had trouble connecting to the AI support server. Please try again." }
        ]);
      }
    } catch (err) {
      console.error("AI Support error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error: Failed to reach the support assistant. Make sure the server is running." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1F6F5C] text-white shadow-xl hover:bg-[#154C3F] transition-all hover:scale-110 active:scale-95 duration-200 border border-white/20"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex h-[500px] w-96 flex-col rounded-2xl border border-[#DAD3C2] bg-white/90 backdrop-blur-md shadow-2xl transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DAD3C2] bg-[#1F6F5C] px-4 py-3 rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#E6E8EA] animate-pulse" />
              <div>
                <h3 className="font-bold text-sm leading-tight">LifeLink Support AI</h3>
                <span className="text-[10px] text-white/80">Online & ready</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-[#3C8B6E]/10 border border-[#3C8B6E]/20 text-[#1F6F5C]">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#1F6F5C] text-white rounded-tr-none"
                      : "bg-[#F3EFE6] text-[#12231F] border border-[#DAD3C2] rounded-tl-none"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-[#1F6F5C]/15 text-[#1F6F5C]">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3C8B6E]/10 border border-[#3C8B6E]/20 text-[#1F6F5C]">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="bg-[#F3EFE6] text-[#4A5C55] max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm border border-[#DAD3C2] rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#4A5C55] rounded-full"></span>
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#4A5C55] rounded-full [animation-delay:0.2s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce bg-[#4A5C55] rounded-full [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Starter Chips (Shown when messages count is low) */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-[#DAD3C2]/50 bg-[#FBF9F5] space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#4A5C55] tracking-wider block">Suggested Questions</span>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-[11px] bg-[#EFEBE0] hover:bg-[#E4DECF] border border-[#DAD3C2] rounded-full px-2.5 py-1 text-[#12231F] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form Input */}
          <div className="border-t border-[#DAD3C2] p-3 bg-[#FBF9F5] rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about organ matching..."
                className="flex-1 bg-white border border-[#DAD3C2] rounded-xl px-3.5 py-2 text-sm text-[#12231F] placeholder-[#4A5C55]/60 focus:border-[#1F6F5C] focus:outline-none focus:ring-1 focus:ring-[#1F6F5C]/30"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1F6F5C] text-white hover:bg-[#154C3F] disabled:opacity-40 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
