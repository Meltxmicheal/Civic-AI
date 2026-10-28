import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { COMPLAINTS } from "../data/civicData"
import { ComplaintCard } from "../components/ComplaintCard"
import { civicIssueService } from "../services/civicIssueService"
import type { ComplaintStatus, CivicIssue } from "../types"

type Filter = "all" | "active" | "resolved" | "reopened"

const ACTIVE_STATUSES: ComplaintStatus[] = [
  "submitted",
  "ai_analysis",
  "assigned",
  "accepted",
  "in_progress",
  "verification",
]

export function CitizenDashboardPage() {
  const { lang, navigate } = useApp()
  const tr = t[lang].dashboard
  const [filter, setFilter] = useState<Filter>("all")
  const [complaints, setComplaints] = useState<CivicIssue[]>(COMPLAINTS)

  useEffect(() => {
    civicIssueService.getIssues({ limit: 200 }).then((list) => {
      if (list && list.length > 0) {
        setComplaints(list)
      }
    })
  }, [])

  const counts = {
    active: complaints.filter((c) => ACTIVE_STATUSES.includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
    reopened: complaints.filter((c) => c.status === "reopened").length,
  }

  const filtered = complaints.filter((c) => {
    if (filter === "all") return true
    if (filter === "active") return ACTIVE_STATUSES.includes(c.status)
    if (filter === "resolved") return c.status === "resolved"
    if (filter === "reopened") return c.status === "reopened"
    return true
  })

  return (
    <main
      id="main-content"
      className="max-w-4xl mx-auto px-4 py-8 animate-fade-in"
    >
      {/* Greeting */}
      <div className="mb-6">
        <h1
          className={`text-2xl font-bold text-[#0c1a30] mb-0.5 ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.greeting} 👋
        </h1>
        <p
          className={`text-sm text-[#64748b] ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            key: "active",
            label: tr.active,
            count: counts.active,
            color: "#b45309",
            bg: "#fef3e8",
            border: "#fed7aa",
          },
          {
            key: "resolved",
            label: tr.resolved,
            count: counts.resolved,
            color: "#15803d",
            bg: "#f0fdf4",
            border: "#bbf7d0",
          },
          {
            key: "reopened",
            label: tr.reopened,
            count: counts.reopened,
            color: "#7c3aed",
            bg: "#f5f3ff",
            border: "#ddd6fe",
          },
        ].map(({ key, label, count, color, bg, border }) => (
          <button
            key={key}
            onClick={() => setFilter(key as Filter)}
            className="rounded-xl p-4 text-center border-2 transition-all"
            style={{
              background: bg,
              borderColor: filter === key ? color : border,
              transform: filter === key ? "scale(1.02)" : undefined,
            }}
            aria-pressed={filter === key}
          >
            <p className="text-2xl font-bold" style={{ color }}>
              {count}
            </p>
            <p
              className={`text-xs font-medium mt-0.5 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
              style={{ color }}
            >
              {label}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`font-semibold text-[#0c1a30] ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.myComplaints}
        </h2>
        <div className="flex border border-[#d0d5e2] rounded-lg overflow-hidden">
          {(["all", "active", "resolved"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[#1c3a6e] text-white"
                  : "text-[#64748b] hover:bg-[#f4f6fa]"
              } ${lang === "ta" ? "font-tamil" : ""}`}
              aria-pressed={filter === f}
            >
              {tr[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Complaints */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#d0d5e2] rounded-xl">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d0d5e2"
            strokeWidth="1.5"
            className="mx-auto mb-3"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p
            className={`text-sm text-[#64748b] mb-4 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.noComplaints}
          </p>
          <button
            onClick={() => navigate("report")}
            className={`px-4 py-2 text-sm font-semibold bg-[#1c3a6e] text-white rounded-lg hover:bg-[#102244] transition-colors ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.noComplaintsCta}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              lang={lang}
              onClick={() => navigate("complaint-detail", c.id)}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate("report")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 bg-[#1c3a6e] text-white text-sm font-semibold rounded-lg hover:bg-[#102244] transition-colors ${
            lang === "ta" ? "font-tamil" : ""
          }`}
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
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v8M8 12h8" />
          </svg>
          {tr.reportNewIssue}
        </button>
      </div>
    </main>
  )
}
