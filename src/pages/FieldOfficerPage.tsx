import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { OFFICERS } from "../data/civicData"
import { civicIssueService } from "../services/civicIssueService"
import { generateCivicReportPDF } from "../services/pdfReportService"
import { getBeforeImage, getAfterImage } from "../utils/imageUtils"
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge"
import { CATEGORY_ICONS } from "../components/CategoryIcons"
import type { CivicIssue } from "../types"

export function FieldOfficerPage() {
  const { lang, navigate } = useApp()
  const tr = t[lang].officer
  const isTamil = lang === "ta"

  const [selectedOfficer, setSelectedOfficer] = useState(OFFICERS[0])
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [activeComplaint, setActiveComplaint] = useState<CivicIssue | null>(null)

  // Resolution Form State
  const [afterPhotoUri, setAfterPhotoUri] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState<string>("")
  const [submittingResolution, setSubmittingResolution] = useState(false)
  const [resolutionSuccess, setResolutionSuccess] = useState(false)

  const fetchAssignedIssues = async () => {
    setLoading(true)
    const all = await civicIssueService.getIssues({ limit: 200 })
    setIssues(all)
    setLoading(false)
  }

  useEffect(() => {
    fetchAssignedIssues()
  }, [])

  // Assigned or in-progress issues for current department / officer
  const assigned = issues.filter(
    (c) =>
      c.status === "in_progress" ||
      c.status === "assigned" ||
      c.status === "submitted" ||
      c.assignedOfficerId === selectedOfficer.id,
  )

  // Handle Photo Selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setAfterPhotoUri(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Submit Resolution Proof to Database
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeComplaint) return

    setSubmittingResolution(true)

    // Fallback sample resolution photo if not captured
    const finalPhoto =
      afterPhotoUri ||
      "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23dcfce7'/><text x='50%25' y='45%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' font-weight='bold' fill='%2315803d'>✓ Work Completed & Repaired</text><text x='50%25' y='60%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='13' fill='%23166534'>Site verified by Officer " +
        encodeURIComponent(selectedOfficer.name) +
        "</text></svg>"

    const updated = await civicIssueService.resolveIssueWithProof(
      activeComplaint.id,
      finalPhoto,
      resolutionNotes || "Issue successfully inspected, repaired, and resolved on site by field officer.",
      selectedOfficer.name,
    )

    if (updated) {
      setActiveComplaint(updated)
      setResolutionSuccess(true)
      fetchAssignedIssues()
    }
    setSubmittingResolution(false)
  }

  if (activeComplaint) {
    return (
      <main id="main-content" className="max-w-md mx-auto px-4 py-6 animate-fade-in pb-16">
        <button
          onClick={() => {
            setActiveComplaint(null)
            setAfterPhotoUri(null)
            setResolutionNotes("")
            setResolutionSuccess(false)
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-[#1c3a6e] mb-4 hover:underline"
        >
          ← {isTamil ? "பணிகள் பட்டியலுக்கு திரும்புக" : "Back to Assignments List"}
        </button>

        {/* Active Complaint Header */}
        <div className="bg-white border border-[#d0d5e2] rounded-3xl p-5 shadow-sm space-y-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 bg-[#e8eef8] rounded-2xl flex items-center justify-center text-[#1c3a6e] flex-shrink-0 text-xl font-bold">
              {CATEGORY_ICONS[activeComplaint.category] || "📍"}
            </div>
            <div>
              <span className="font-mono text-[10px] font-bold text-[#1c3a6e] bg-blue-50 px-2 py-0.5 rounded-md">
                {activeComplaint.id}
              </span>
              <h2 className="font-extrabold text-sm text-gray-900 mt-1">
                {isTamil && activeComplaint.titleTa ? activeComplaint.titleTa : activeComplaint.title}
              </h2>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {activeComplaint.description}
          </p>

          <div className="text-[11px] text-gray-500 font-medium pt-2 border-t border-gray-100">
            📍 {activeComplaint.address} · {activeComplaint.district}
          </div>

          {/* Citizen Reporter Information */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-semibold text-[11px]">
              {isTamil ? "புகார்தாரர்:" : "Citizen Reporter:"}
            </span>
            {activeComplaint.anonymous ? (
              <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                🕶️ {isTamil ? "அநாமதேய புகார்" : "Anonymous"}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-800 text-[11px] flex items-center gap-1">
                  <span>✓</span> {activeComplaint.citizenName || "Verified Citizen"}
                </span>
                {(activeComplaint.citizenPhone || activeComplaint.citizenMobile) && (
                  <div className="flex items-center gap-1">
                    <a
                      href={`tel:+91${activeComplaint.citizenPhone || activeComplaint.citizenMobile}`}
                      className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold rounded"
                    >
                      📞 Call
                    </a>
                    <a
                      href={`sms:+91${activeComplaint.citizenPhone || activeComplaint.citizenMobile}?body=${encodeURIComponent(`Update on Complaint ${activeComplaint.id}: Officer assigned.`)}`}
                      className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold rounded"
                    >
                      📱 SMS
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap pt-1">
            <StatusBadge status={activeComplaint.status} lang={lang} size="sm" />
            <PriorityBadge priority={activeComplaint.priority} lang={lang} size="sm" />
            <SLABadge
              hoursRemaining={activeComplaint.slaRemainingHours}
              breached={activeComplaint.slaBreached}
              lang={lang}
              size="sm"
            />
          </div>
        </div>

        {/* Evidence Comparison: Before Photo vs After Photo */}
        <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4 mb-5">
          <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
            📸 1. Initial Incident Photo (Before)
          </h3>

          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
            <img
              src={getBeforeImage(activeComplaint)}
              alt="Before photo"
              className="w-full h-48 object-cover"
            />
            <div className="p-2 bg-gray-50 text-[10px] text-gray-600 font-bold text-center border-t border-gray-100 flex items-center justify-between px-3">
              <span>📸 Citizen Incident Evidence</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-extrabold">Verified</span>
            </div>
          </div>
        </div>

        {/* Resolution Workflow */}
        {resolutionSuccess || activeComplaint.status === "resolved" ? (
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-4 animate-fade-in shadow-sm">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-900">
                {isTamil ? "தீர்வு ஆதாரம் வெற்றிகரமாக சேமிக்கப்பட்டது!" : "Resolution Proof Saved to Database!"}
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                The complaint status is now <strong>RESOLVED</strong>. The After Photo and officer note have been updated on the home dashboard and live map.
              </p>
            </div>

            {activeComplaint.resolvedImageUrl && (
              <div className="rounded-2xl overflow-hidden border border-emerald-300">
                <img
                  src={activeComplaint.resolvedImageUrl}
                  alt="After photo proof"
                  className="w-full h-44 object-cover"
                />
                <div className="p-2 bg-emerald-100 text-[10px] font-bold text-emerald-900 text-center">
                  ✓ Verified Resolution After Photo
                </div>
              </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => generateCivicReportPDF(activeComplaint, lang)}
                className="px-4 py-2.5 bg-[#cf6009] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                📥 Download PDF Dossier
              </button>
              <button
                onClick={() => {
                  setActiveComplaint(null)
                  setResolutionSuccess(false)
                }}
                className="px-4 py-2.5 bg-[#1c3a6e] text-white text-xs font-bold rounded-xl"
              >
                Back to Tasks
              </button>
            </div>
          </div>
        ) : (
          /* Officer Resolution Proof Form */
          <form onSubmit={handleSubmitResolution} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <span className="text-lg">🛠️</span>
              <h3 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider">
                2. Take After Photo & Complete Repair
              </h3>
            </div>

            {/* After Photo Upload/Capture */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                {isTamil ? "தீர்வு புகைப்பட ஆதாரம் (After Photo)" : "Upload Proof of Work (After Photo)"}
              </label>

              {afterPhotoUri ? (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-300">
                  <img src={afterPhotoUri} alt="After photo" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setAfterPhotoUri(null)}
                    className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white rounded-lg text-xs font-bold hover:bg-black/80"
                  >
                    ✕ Retake Photo
                  </button>
                  <div className="p-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold text-center">
                    ✓ After photo ready for submission
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#1c3a6e] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50">
                  <span className="text-3xl mb-1">📸</span>
                  <span className="text-xs font-bold text-[#1c3a6e]">
                    {isTamil ? "பணி முடிந்த புகைப்படத்தை எடுக்கவும்" : "Capture / Upload After Photo"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    Click to select from camera or gallery
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Resolution Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {isTamil ? "களப் பணியாளர் தீர்வு குறிப்பு" : "Field Officer Resolution Notes"}
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={
                  isTamil
                    ? "எ.கா., குழி தார் பூசி சீரமைக்கப்பட்டது, குப்பை அகற்றப்பட்டது..."
                    : "e.g., Road resurfacing completed, garbage cleared, tested streetlight circuit..."
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submittingResolution}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submittingResolution ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Saving Resolution to Database...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{isTamil ? "தீர்வை தரவுத்தளத்தில் சேமிக்கவும்" : "Submit Resolution Proof to Database"}</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    )
  }

  return (
    <main id="main-content" className="max-w-lg mx-auto px-4 py-6 animate-fade-in pb-16">
      {/* Officer Header Card */}
      <div className="bg-[#1c3a6e] text-white rounded-3xl p-5 shadow-md mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center font-black text-lg">
              👤
            </div>
            <div>
              <h1 className="font-extrabold text-base">{selectedOfficer.name}</h1>
              <p className="text-xs text-blue-200">{selectedOfficer.department}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Field Active
          </span>
        </div>

        {/* Switch Officer Selector */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-white/70">Logged-in Officer:</span>
          <select
            value={selectedOfficer.id}
            onChange={(e) => {
              const found = OFFICERS.find((o) => o.id === e.target.value)
              if (found) setSelectedOfficer(found)
            }}
            className="px-2.5 py-1 bg-white text-gray-900 font-bold text-xs rounded-xl focus:outline-none"
          >
            {OFFICERS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.departmentId})
              </option>
            ))}
          </select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2 bg-white/10 rounded-xl">
            <div className="text-[9px] text-white/70 uppercase font-bold">Assigned</div>
            <div className="text-base font-black text-amber-300">{assigned.length}</div>
          </div>
          <div className="p-2 bg-white/10 rounded-xl">
            <div className="text-[9px] text-white/70 uppercase font-bold">Resolved</div>
            <div className="text-base font-black text-emerald-300">{selectedOfficer.completedToday}</div>
          </div>
          <div className="p-2 bg-white/10 rounded-xl">
            <div className="text-[9px] text-white/70 uppercase font-bold">Rating</div>
            <div className="text-base font-black text-purple-300">{selectedOfficer.rating} ★</div>
          </div>
        </div>
      </div>

      {/* Assigned Tasks Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm text-gray-900">
            {isTamil ? "ஒதுக்கப்பட்ட களப் பணிகள்" : "My Active Field Queue"} ({assigned.length})
          </h2>
          <button
            onClick={fetchAssignedIssues}
            className="text-xs font-bold text-[#1c3a6e] hover:underline"
          >
            🔄 Refresh
          </button>
        </div>

        {assigned.length === 0 ? (
          <div className="p-8 bg-white rounded-3xl border border-gray-200 text-center text-gray-500 text-xs">
            No active assignments in your queue.
          </div>
        ) : (
          assigned.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveComplaint(c)}
              className="w-full text-left bg-white border border-gray-200 hover:border-[#1c3a6e] rounded-3xl p-4 shadow-xs hover:shadow-md transition-all space-y-2.5 block"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {CATEGORY_ICONS[c.category] || "📍"}
                  </span>
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#1c3a6e] bg-blue-50 px-2 py-0.5 rounded-md">
                      {c.id}
                    </span>
                    <h3 className="font-bold text-xs text-gray-900 mt-0.5">
                      {isTamil && c.titleTa ? c.titleTa : c.title}
                    </h3>
                  </div>
                </div>
                <PriorityBadge priority={c.priority} lang={lang} size="sm" />
              </div>

              <p className="text-xs text-gray-500 line-clamp-2">
                {c.description}
              </p>

              <div className="text-[11px] text-gray-500">
                📍 {c.address}
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <StatusBadge status={c.status} lang={lang} size="sm" />
                <span className="font-bold text-[#1c3a6e] flex items-center gap-1">
                  <span>Take Action</span>
                  <span>→</span>
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </main>
  )
}
