import type { ComplaintStatus, Priority, Language } from "../types"
import { t } from "../i18n/translations"

interface StatusBadgeProps {
  status?: ComplaintStatus
  lang?: Language
  size?: "sm" | "md"
}

const STATUS_CONFIG: Record<ComplaintStatus, { icon: string; classes: string }> =
  {
    submitted: {
      icon: "○",
      classes: "bg-blue-50 text-blue-700 border-blue-200",
    },
    ai_analysis: {
      icon: "⟳",
      classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    assigned: {
      icon: "→",
      classes: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
    accepted: { icon: "◎", classes: "bg-sky-50 text-sky-700 border-sky-200" },
    in_progress: {
      icon: "●",
      classes: "bg-amber-50 text-amber-700 border-amber-200",
    },
    verification: {
      icon: "◈",
      classes: "bg-purple-50 text-purple-700 border-purple-200",
    },
    resolved: {
      icon: "✓",
      classes: "bg-green-50 text-green-700 border-green-200",
    },
    reopened: {
      icon: "↺",
      classes: "bg-orange-50 text-orange-700 border-orange-200",
    },
    closed: { icon: "×", classes: "bg-gray-100 text-gray-600 border-gray-200" },
  }

export function StatusBadge({ status = "submitted", lang = "en", size = "md" }: StatusBadgeProps) {
  const safeLang = lang === "ta" ? "ta" : "en"
  const safeStatus = (status && STATUS_CONFIG[status]) ? status : "submitted"
  const config = STATUS_CONFIG[safeStatus]
  const tr = t[safeLang] || t.en
  const label = tr?.status?.[safeStatus] || safeStatus
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${px} ${config.classes} ${
        safeLang === "ta" ? "font-tamil" : ""
      }`}
      aria-label={`${tr?.complaint?.status || "Status"}: ${label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority?: Priority
  lang?: Language
  size?: "sm" | "md"
}

const PRIORITY_CONFIG: Record<Priority, { icon: string; classes: string }> = {
  low: { icon: "▼", classes: "bg-gray-100 text-gray-600 border-gray-200" },
  medium: {
    icon: "■",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  high: {
    icon: "▲",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
  },
  critical: { icon: "!", classes: "bg-red-50 text-red-700 border-red-200" },
}

export function PriorityBadge({
  priority = "medium",
  lang = "en",
  size = "md",
}: PriorityBadgeProps) {
  const safeLang = lang === "ta" ? "ta" : "en"
  const safePriority = (priority && PRIORITY_CONFIG[priority]) ? priority : "medium"
  const config = PRIORITY_CONFIG[safePriority]
  const tr = t[safeLang] || t.en
  const label = tr?.priority?.[safePriority] || safePriority
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${px} ${config.classes} ${
        safeLang === "ta" ? "font-tamil" : ""
      }`}
      aria-label={`${tr?.complaint?.priority || "Priority"}: ${label}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {label}
    </span>
  )
}

interface SLABadgeProps {
  hoursRemaining?: number
  breached?: boolean
  lang?: Language
  size?: "sm" | "md"
}

export function SLABadge({
  hoursRemaining = 24,
  breached = false,
  lang = "en",
  size = "md",
}: SLABadgeProps) {
  const safeLang = lang === "ta" ? "ta" : "en"
  const tr = t[safeLang] || t.en
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
  if (breached) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded border font-medium ${px} bg-red-50 text-red-700 border-red-200 ${
          safeLang === "ta" ? "font-tamil" : ""
        }`}
      >
        <span aria-hidden="true">!</span>
        {tr?.complaint?.slaBreached || "SLA Breached"}
      </span>
    )
  }
  const urgent = hoursRemaining <= 6
  const warning = hoursRemaining <= 24
  const classes = urgent
    ? "bg-red-50 text-red-700 border-red-200"
    : warning
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-green-50 text-green-700 border-green-200"
  const icon = urgent ? "!" : warning ? "▲" : "✓"
  const label = hoursRemaining < 1 ? "<1" : `${hoursRemaining}`
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${px} ${classes} ${
        safeLang === "ta" ? "font-tamil" : ""
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label} {tr?.complaint?.slaHours || "h SLA"}
    </span>
  )
}
