import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"

interface Props {
  onClose: () => void
}

export function AccessibilityToolbar({ onClose }: Props) {
  const { lang, accessibility, setAccessibility } = useApp()
  const tr = t[lang].accessibility

  const toggle = (key: keyof typeof accessibility) => {
    const next = { ...accessibility, [key]: !accessibility[key] }
    if (key === "largeText" && next.largeText) next.xlargeText = false
    if (key === "xlargeText" && next.xlargeText) next.largeText = false
    setAccessibility(next)
  }

  const reset = () =>
    setAccessibility({
      highContrast: false,
      largeText: false,
      xlargeText: false,
      reduceMotion: false,
      lineSpacing: false,
      highlightLinks: false,
    })

  const Btn = ({
    label,
    active,
    onClick,
  }: {
    label: string
    active: boolean
    onClick: () => void
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
        active
          ? "bg-[#1c3a6e] text-white border-[#1c3a6e]"
          : "bg-white text-[#334155] border-[#d0d5e2] hover:border-[#1c3a6e]"
      } ${lang === "ta" ? "font-tamil" : ""}`}
      aria-pressed={active}
    >
      {label}
    </button>
  )

  return (
    <div
      className="bg-[#f4f6fa] border-b border-[#d0d5e2] px-4 py-2"
      role="region"
      aria-label={tr.title}
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
        <span
          className={`text-xs font-semibold text-[#1c3a6e] mr-1 ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.title}
        </span>
        <Btn
          label={tr.increaseText}
          active={accessibility.largeText}
          onClick={() => toggle("largeText")}
        />
        <Btn
          label={tr.decreaseText}
          active={accessibility.xlargeText}
          onClick={() => toggle("xlargeText")}
        />
        <Btn
          label={tr.highContrast}
          active={accessibility.highContrast}
          onClick={() => toggle("highContrast")}
        />
        <Btn
          label={tr.highlightLinks}
          active={accessibility.highlightLinks}
          onClick={() => toggle("highlightLinks")}
        />
        <Btn
          label={tr.lineSpacing}
          active={accessibility.lineSpacing}
          onClick={() => toggle("lineSpacing")}
        />
        <Btn
          label={tr.reduceMotion}
          active={accessibility.reduceMotion}
          onClick={() => toggle("reduceMotion")}
        />
        <button
          onClick={reset}
          className={`px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors ml-auto ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.reset}
        </button>
        <button
          onClick={onClose}
          className="p-1 text-[#64748b] hover:text-[#334155]"
          aria-label={tr.closeToolbar}
        >
          <svg
            width="14"
            height="14"
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
    </div>
  )
}
