"use client";

import React, { useState, useRef, useEffect } from "react";
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
      "Halo! Saya siap membantu Anda dengan informasi tentang Nusantara Messe 2026. Ada yang ingin ditanyakan?",
  },
  {
    name: "Neng Rima",
    description: "Your cultural ambassador and event specialist",
    personality:
      "Professional, detailed, and passionate about business opportunities",
    avatar: "👩🏽‍💼",
    greeting:
      "Selamat datang! Saya dari tim Nusantara Messe 2026. Mari saya bantu Anda menemukan peluang terbaik di acara kami!",
  },
];

// Core suggested questions - reduced to 3 for better UX
const suggestedQuestions = [
  "Kapan dan dimana acara Nusantara Messe 2026?",
  "Berapa biaya sponsorship untuk acara ini?",
  "Apa saja keuntungan menjadi sponsor?",
];

// Business-focused quick actions
const quickActions = [
  {
    icon: "💼",
    label: "Sponsorship Info",
    action: "sponsorship",
    description: "Learn about partnership opportunities",
  },
  {
    icon: "📊",
    label: "ROI Calculator",
    action: "roi",
    description: "Calculate your potential returns",
  },
  {
    icon: "🎫",
    label: "Request Access",
    action: "access",
    description: "Get exclusive event access",
  },
  {
    icon: "📋",
    label: "Event Details",
    action: "details",
    description: "Complete event information",
  },
];

// Contextual follow-up suggestions based on conversation phase
const getContextualSuggestions = (phase: string) => {
  const suggestions = {
    greeting: [
      "Apa yang membuat acara ini unik?",
      "Siapa yang akan hadir di acara ini?",
      "Bagaimana cara mendaftar sebagai sponsor?",
    ],
    exploring: [
      "Berapa biaya sponsorship?",
      "Apa saja benefit sponsorship?",
      "Apakah ada ROI calculator?",
    ],
    engaged: [
      "Saya ingin diskusi lebih detail",
      "Bisa kirim brochure lengkap?",
      "Siapa kontak person untuk partnership?",
    ],
    action: [
      "Saya siap request access",
      "Kirim proposal sponsorship",
      "Jadwalkan meeting dengan tim",
    ],
  };

  return suggestions[phase as keyof typeof suggestions] || suggestions.greeting;
};

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
  const [conversationPhase, setConversationPhase] = useState<
    "greeting" | "exploring" | "engaged" | "action"
  >("greeting");
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

    // Update conversation phase based on message content
    if (messages.length > 1) {
      setConversationPhase("engaged");
    }

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
          // Allow server to decide: if GEMINI_API_KEY is unset it will fallback to local
          mode: "auto",
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

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      sponsorship:
        "Saya ingin tahu lebih lanjut tentang peluang sponsorship untuk Nusantara Messe 2026. Bisakah Anda memberikan informasi lengkap?",
      roi: "Tolong bantu saya menghitung ROI untuk sponsorship acara ini.",
      access:
        "Saya tertarik untuk mendapatkan akses eksklusif ke Nusantara Messe 2026.",
      details:
        "Bisakah Anda memberikan detail lengkap tentang acara Nusantara Messe 2026?",
    };

    const message = actionMessages[action as keyof typeof actionMessages];
    if (message) {
      // Track quick action usage
      try {
        window.dispatchEvent(
          new CustomEvent("analytics-track" as unknown as string, {
            detail: {
              type: "chat_quick_action",
              data: {
                action,
                phase: conversationPhase,
                timestamp: new Date().toISOString(),
              },
            },
          }) as Event
        );
      } catch {}

      handleSendMessage(message);
      setConversationPhase("action");
    }
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
        onClick={() => {
          setIsOpen(true);
          // Track chat opened event
          try {
            window.dispatchEvent(
              new CustomEvent("analytics-track" as unknown as string, {
                detail: {
                  type: "chat_opened",
                  data: {
                    assistant: selectedAssistant,
                    timestamp: new Date().toISOString(),
                    source: "floating_button",
                  },
                },
              }) as Event
            );
          } catch {}
        }}
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isOpen ? "hidden" : "block"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center">
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
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-[calc(100vw-2rem)] md:w-96 h-[calc(100vh-8rem)] md:h-[650px] max-h-[650px] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-800 rounded-2xl shadow-2xl border border-cyan-500/20 flex flex-col overflow-hidden backdrop-blur-xl min-h-0"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                  {assistants[selectedAssistant].avatar}
                </div>
                <div>
                  <h3 className="font-bold text-white" aria-hidden="true">
                    {`${assistants[selectedAssistant].avatar} ${assistants[selectedAssistant].name}`}
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
                    // Track chat closed event
                    try {
                      window.dispatchEvent(
                        new CustomEvent(
                          "analytics-track" as unknown as string,
                          {
                            detail: {
                              type: "chat_closed",
                              data: {
                                assistant: selectedAssistant,
                                messageCount: messages.length,
                                conversationPhase,
                                duration:
                                  Date.now() -
                                  (messages[0]?.timestamp.getTime() ||
                                    Date.now()),
                                timestamp: new Date().toISOString(),
                              },
                            },
                          }
                        ) as Event
                      );
                    } catch {}

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
                    <span className="mr-1">{assistant.avatar}</span>{" "}
                    <span>{assistant.name}</span>
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-full">
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
                    className={`max-w-[85%] md:max-w-[90%] p-3 rounded-2xl ${
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
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed whitespace-pre-line break-words">
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

            {/* Quick Actions */}
            {messages.length <= 1 && (
              <div className="p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border-t border-cyan-500/10">
                <h4 className="text-sm font-medium text-cyan-300 mb-3 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Quick Actions:
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.action)}
                      className="bg-white/5 hover:bg-white/10 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg p-3 transition-all duration-200 group"
                    >
                      <div className="text-xs font-medium text-white group-hover:text-cyan-300">
                        <span className="mr-1">{action.icon}</span>
                        {action.label}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {action.description}
                      </div>
                      {/* Hidden combined text to aid tests and a11y name */}
                      <span className="sr-only">
                        {action.icon} {action.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Initial Suggested Questions */}
                <div className="border-t border-white/10 pt-3">
                  <h4 className="text-sm font-medium text-cyan-300 mb-3 flex items-center">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Pertanyaan Umum:
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          console.log("Clicked suggested question:", question);
                          handleSuggestionClick(question);
                        }}
                        className="text-sm bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 text-cyan-300 px-4 py-3 rounded-lg transition-all duration-200 border border-cyan-500/30 hover:border-cyan-500/50 text-left hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contextual Suggestions */}
                {messages.length > 1 && (
                  <div className="border-t border-white/10 pt-3">
                    <h4 className="text-sm font-medium text-cyan-300 mb-3 flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Saran Selanjutnya:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getContextualSuggestions(conversationPhase)
                        .slice(0, 2)
                        .map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(question)}
                            className="text-xs bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 px-3 py-2 rounded-full transition-colors border border-cyan-500/30"
                          >
                            {question}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex-shrink-0">
              <div className="flex items-center space-x-2 md:space-x-3">
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
                    className={`w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 md:py-3 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 transition-all duration-200 text-sm md:text-base min-h-[44px] md:min-h-[48px]${
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
                  aria-label="Send"
                  onClick={() => handleSendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 md:p-3 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px]"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </button>

                <button
                  onClick={resetChat}
                  className="p-3 md:p-3 bg-white/10 hover:bg-white/20 text-gray-400 rounded-lg transition-colors min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px]"
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
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
