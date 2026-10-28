import type { ReactNode } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import type { Page } from "../types"

const TABS: {
  page: Page
  icon: ReactNode
  labelKey: keyof typeof t["en"]["nav"]
  highlight?: boolean
}[] = [
  {
    page: "home",
    labelKey: "home",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
      </svg>
    ),
  },
  {
    page: "report",
    labelKey: "report",
    highlight: true,
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    page: "track",
    labelKey: "track",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    page: "map",
    labelKey: "map",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <path d="M8 2v16M16 6v16" />
      </svg>
    ),
  },
]

export function MobileBottomNav() {
  const { lang, currentPage, navigate, setChatOpen } = useApp()
  const tr = t[lang].nav

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#d0d5e2] civic-shadow-lg"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch">
        {TABS.map(({ page, icon, labelKey, highlight }) => {
          const isActive = currentPage === page
          const label = tr[labelKey]
          if (highlight) {
            return (
              <button
                key={page}
                onClick={() => navigate(page)}
                className="flex-1 flex flex-col items-center justify-center py-2 relative"
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center -mt-5 mb-0.5 transition-colors ${
                    isActive ? "bg-[#102244]" : "bg-[#1c3a6e]"
                  } text-white shadow-lg`}
                >
                  {icon}
                </div>
                <span
                  className={`text-[10px] font-semibold text-[#1c3a6e] ${
                    lang === "ta" ? "font-tamil" : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            )
          }
          return (
            <button
              key={page}
              onClick={() => navigate(page)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive
                  ? "text-[#1c3a6e]"
                  : "text-[#64748b] hover:text-[#334155]"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={label}
            >
              {icon}
              <span
                className={`text-[10px] font-medium ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
        <button
          onClick={() => setChatOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[#0a6e5f] hover:text-[#075048] transition-colors"
          aria-label={tr.aiAssistant}
        >
          <svg
            width="20"
            height="20"
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
          <span className="text-[10px] font-medium">AI</span>
        </button>
      </div>
    </nav>
  )
}
