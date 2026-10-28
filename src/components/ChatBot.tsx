import { useState, useRef, useEffect } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { CHAT_RESPONSES } from "../data/civicData"
import { runCivicChatFlow } from "../ai/flows/chat.ts"

interface Message {
  id: number
  role: "user" | "bot"
  text: string
}

const KEYWORD_MAP: Record<string, string> = {
  pothole: "pothole",
  road: "pothole",
  குழி: "pothole",
  சாலை: "pothole",
  track: "track",
  கண்காணி: "track",
  புகார்: "track",
  garbage: "garbage",
  குப்பை: "garbage",
  submit: "submit",
  சமர்ப்பி: "submit",
  நடக்கும்: "submit",
}

function getBotResponse(text: string, lang: "en" | "ta"): string {
  const lower = text.toLowerCase()
  for (const [kw, key] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(kw)) {
      return CHAT_RESPONSES[key][lang]
    }
  }
  return CHAT_RESPONSES.default[lang]
}

export function ChatBot() {
  const { lang, chatOpen, setChatOpen } = useApp()
  const tr = t[lang].chat
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: t[lang].chat.greeting },
  ])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update initial greeting when language changes if user hasn't sent messages
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [{ id: 0, role: "bot", text: t[lang].chat.greeting }]
      }
      return prev
    })
  }, [lang])

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [chatOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  const send = async (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now(), role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setTyping(true)

    try {
      const aiResult = await runCivicChatFlow({
        message: text,
        locale: lang,
      })
      if (aiResult && aiResult.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "bot", text: aiResult.reply },
        ])
      } else {
        const fallback = getBotResponse(text, lang)
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, role: "bot", text: fallback },
        ])
      }
    } catch (err) {
      const fallback = getBotResponse(text, lang)
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "bot", text: fallback },
      ])
    } finally {
      setTyping(false)
    }
  }

  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 bg-[#0a6e5f] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#075048] transition-colors"
        aria-label={tr.openAssistant}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Backdrop on mobile */}
      <div
        className="fixed inset-0 bg-black/20 z-50 lg:hidden"
        onClick={() => setChatOpen(false)}
        aria-hidden="true"
      />
      {/* Chat panel */}
      <div
        className="fixed inset-x-0 bottom-0 top-auto lg:inset-auto lg:right-6 lg:bottom-6 lg:top-auto lg:w-96 z-50 bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl flex flex-col animate-slide-in-right"
        role="dialog"
        aria-label="CivicAI Assistant"
        aria-modal="true"
        style={{ maxHeight: "calc(100vh - 80px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d0d5e2] bg-[#0a6e5f] text-white rounded-t-2xl lg:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">AI</span>
            </div>
            <div>
              <p className="font-semibold text-sm">CivicAI Assistant</p>
              <p
                className={`text-xs text-white/70 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.online}
              </p>
            </div>
          </div>
          <button
            onClick={() => setChatOpen(false)}
            className="p-1 hover:bg-white/20 rounded"
            aria-label={tr.closeChat}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          role="log"
          aria-live="polite"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "bot" && (
                <div className="w-7 h-7 bg-[#e0f4f1] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-[#0a6e5f]">AI</span>
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#1c3a6e] text-white rounded-br-sm"
                    : "bg-[#f4f6fa] text-[#0c1a30] rounded-bl-sm"
                } ${lang === "ta" ? "font-tamil" : ""}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#e0f4f1] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#0a6e5f]">AI</span>
              </div>
              <div className="bg-[#f4f6fa] px-3 py-2 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span
                    className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-pulse-dot"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-pulse-dot"
                    style={{ animationDelay: "200ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 bg-[#64748b] rounded-full animate-pulse-dot"
                    style={{ animationDelay: "400ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {tr.prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className={`text-xs px-2.5 py-1 bg-[#e8eef8] text-[#1c3a6e] rounded-full hover:bg-[#1c3a6e] hover:text-white transition-colors ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-[#d0d5e2] flex-shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder={tr.placeholder}
              className={`flex-1 text-sm px-3 py-2 border border-[#d0d5e2] rounded-lg focus:outline-none focus:border-[#1c3a6e] focus:ring-1 focus:ring-[#1c3a6e] ${
                lang === "ta" ? "font-tamil" : ""
              }`}
              aria-label={tr.placeholder}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              className="px-3 py-2 bg-[#0a6e5f] text-white rounded-lg hover:bg-[#075048] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={tr.sendMessage}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4z" />
              </svg>
            </button>
          </div>
          <p
            className={`text-center text-[10px] text-[#64748b] mt-1.5 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.disclaimer}
          </p>
        </div>
      </div>
    </>
  )
}
