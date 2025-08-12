"use client";

import { useState, useRef, useEffect } from "react";
import { getCurrentAnalyticsSessionId } from "@/lib/analytics/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Sparkles,
  Globe,
  Calendar,
  MapPin,
  Euro,
  Users,
  Info,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Star,
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  type?: "text" | "suggestion" | "info";
}

interface Assistant {
  name: string;
  description: string;
  personality: string;
  avatar: string;
  greeting: string;
}

const assistants: Assistant[] = [
  {
    name: "Bang Ucup",
    description: "Your friendly Nusantara Messe 2026 guide",
    personality:
      "Warm, knowledgeable, and enthusiastic about Indonesian culture",
    avatar: "👨🏽‍💼",
    greeting:
      "Halo! Saya Bang Ucup, siap membantu Anda dengan informasi tentang Nusantara Messe 2026. Ada yang ingin ditanyakan?",
  },
  {
    name: "Neng Rima",
    description: "Your cultural ambassador and event specialist",
    personality:
      "Professional, detailed, and passionate about business opportunities",
    avatar: "👩🏽‍💼",
    greeting:
      "Selamat datang! Saya Neng Rima dari tim Nusantara Messe 2026. Mari saya bantu Anda menemukan peluang terbaik di acara kami!",
  },
];

const suggestedQuestions = [
  "Kapan dan dimana acara Nusantara Messe 2026?",
  "Berapa biaya sponsorship untuk acara ini?",
  "Apa saja keuntungan menjadi sponsor?",
  "Siapa target audiens acara ini?",
  "Bagaimana teknologi AI digunakan dalam acara?",
  "Apa yang membuat acara ini berbeda?",
];

const quickInfo = [
  { icon: Calendar, label: "Date", value: "Aug 7-8, 2026" },
  { icon: MapPin, label: "Venue", value: "Arena Berlin" },
  { icon: Users, label: "Attendees", value: "1,800+ Professionals" },
  { icon: Euro, label: "Sponsorship", value: "From €5,000" },
];

const ChatAssistantSection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isVoiceToggleEnabled = false; // Temporarily hide voice toggle until implemented
  const transcriptRef = useRef<
    { role: "user" | "assistant"; content: string }[]
  >([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    setIsClient(true);
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isClient && isOpen && messages.length === 0) {
      // Initialize with greeting
      const assistant = assistants[selectedAssistant];
      setMessages([
        {
          id: Date.now().toString(),
          text: assistant.greeting,
          sender: "assistant",
          timestamp: new Date(),
          type: "text",
        },
      ]);
    }
  }, [isClient, isOpen, selectedAssistant, messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    transcriptRef.current.push({ role: "user", content: userMessage.text });
    try {
      const content = userMessage.text;
      const tokens = Math.max(1, Math.round(content.length / 4));
      window.dispatchEvent(
        new CustomEvent("analytics-track" as unknown as string, {
          detail: {
            type: "chat_message",
            data: { role: "user", length: content.length, content, tokens },
          },
        }) as Event
      );
    } catch {}
    setInputText("");
    setIsLoading(true);

    try {
      // Server-side Gemini call via API route (avoids 403 and keeps key server-side)
      const res = await fetch("/api/chat/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: text,
          assistantType: selectedAssistant === 0 ? "ucup" : "rima",
        }),
      });
      if (!res.ok) throw new Error(`chat_failed ${res.status}`);
      const { reply } = (await res.json()) as { reply: string };
      const response = reply;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: "assistant",
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, assistantMessage]);
      transcriptRef.current.push({
        role: "assistant",
        content: assistantMessage.text,
      });
      try {
        const content = assistantMessage.text;
        const tokens = Math.max(1, Math.round(content.length / 4));
        window.dispatchEvent(
          new CustomEvent("analytics-track" as unknown as string, {
            detail: {
              type: "chat_message",
              data: {
                role: "assistant",
                length: content.length,
                content,
                tokens,
              },
            },
          }) as Event
        );
      } catch {}
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Maaf, saya mengalami gangguan teknis. Silakan coba lagi atau hubungi tim support kami.",
        sender: "assistant",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed direct client Gemini call; handled by /api/chat/generate

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const resetChat = () => {
    setMessages([]);
    transcriptRef.current = [];
    // Use setTimeout to ensure this runs after state update
    setTimeout(() => {
      const assistant = assistants[selectedAssistant];
      setMessages([
        {
          id: Date.now().toString(),
          text: assistant.greeting,
          sender: "assistant",
          timestamp: new Date(),
          type: "text",
        },
      ]);
    }, 0);
  };

  async function sendSummaryNow(): Promise<void> {
    try {
      const sid = getCurrentAnalyticsSessionId();
      const transcript = transcriptRef.current;
      if (!sid || !transcript || transcript.length === 0) return;
      await fetch("/api/analytics/chat/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify({ sessionId: sid, transcript }),
      });
    } catch {}
  }

  // Summarize on close/pagehide when we have a sessionId and some transcript
  useEffect(() => {
    function summarize() {
      try {
        const sid = getCurrentAnalyticsSessionId();
        const transcript = transcriptRef.current;
        if (!sid || !transcript || transcript.length === 0) return;
        // fire and forget
        fetch("/api/analytics/chat/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          keepalive: true,
          body: JSON.stringify({ sessionId: sid, transcript }),
        }).catch(() => {});
      } catch {}
    }
    function onPageHide() {
      summarize();
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Implement voice recognition here
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isOpen ? "hidden" : "block"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-8 h-8" />
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold">!</span>
        </div>
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                  {assistants[selectedAssistant].avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {assistants[selectedAssistant].name}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {assistants[selectedAssistant].description}
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Info className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => {
                    void sendSummaryNow();
                    setIsOpen(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Assistant Selection */}
            <div className="p-4 bg-white/5 border-b border-white/10">
              <div className="flex space-x-2">
                {assistants.map((assistant, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAssistant(index)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedAssistant === index
                        ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                        : "bg-white/10 text-gray-300 hover:bg-white/20"
                    }`}
                  >
                    {assistant.avatar} {assistant.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Info Panel */}
            {showInfo && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="bg-white/5 border-b border-white/10 p-4 overflow-hidden"
              >
                <h4 className="font-bold text-white mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-cyan-400" />
                  Quick Info
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {quickInfo.map((info, index) => (
                    <div key={index} className="bg-white/10 rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <info.icon className="w-4 h-4 text-cyan-400 mr-2" />
                        <span className="text-xs text-gray-400">
                          {info.label}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white">
                        {info.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-white/10 text-gray-100 rounded-bl-md"
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === "assistant" && (
                        <div className="text-lg">
                          {assistants[selectedAssistant].avatar}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">
                          {message.text}
                        </p>
                        <div className="text-xs opacity-70 mt-1">
                          {typeof window !== "undefined"
                            ? message.timestamp.toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 rounded-2xl rounded-bl-md p-3 flex items-center space-x-2">
                    <div className="text-lg">
                      {assistants[selectedAssistant].avatar}
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Questions */}
            {messages.length <= 1 && (
              <div className="p-4 bg-white/5 border-t border-white/10">
                <h4 className="text-sm font-medium text-gray-300 mb-3">
                  Pertanyaan Umum:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(question)}
                      className="text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-full transition-colors border border-blue-500/30"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage(inputText)
                    }
                    placeholder="Ketik pertanyaan Anda..."
                    className={`w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50${
                      isVoiceToggleEnabled ? " pr-12" : ""
                    }`}
                    disabled={isLoading}
                  />
                  {isVoiceToggleEnabled && (
                    <button
                      onClick={toggleVoice}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                        isListening
                          ? "bg-red-500/20 text-red-400"
                          : "hover:bg-white/20 text-gray-400"
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>

                <button
                  onClick={resetChat}
                  className="p-3 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                    className="flex items-center text-xs text-gray-400 hover:text-gray-300"
                  >
                    {isSoundEnabled ? (
                      <Volume2 className="w-3 h-3 mr-1" />
                    ) : (
                      <VolumeX className="w-3 h-3 mr-1" />
                    )}
                    Audio
                  </button>
                  <div className="flex items-center text-xs text-gray-400">
                    <Globe className="w-3 h-3 mr-1" />
                    Indonesian/English
                  </div>
                </div>

                <div className="flex items-center text-xs text-gray-400">
                  <Star className="w-3 h-3 mr-1 text-yellow-400" />
                  Powered by Gemini AI
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistantSection;
