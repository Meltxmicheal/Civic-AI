import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { COMPLAINTS, OFFICERS } from "../data/civicData"
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge"
import { CATEGORY_ICONS } from "../components/CategoryIcons"
import { CivicMap } from "../components/CivicMap"
import { civicIssueService } from "../services/civicIssueService.ts"
import { generateCivicReportPDF } from "../services/pdfReportService.ts"
import { getBeforeImage, getAfterImage } from "../utils/imageUtils.ts"
import type { CivicIssue } from "../types/index.ts"


export function ComplaintDetailPage() {
  const { lang, navigate, selectedComplaintId } = useApp()
  const tr = t[lang]
  const isTamil = lang === "ta"

  const [complaint, setComplaint] = useState<CivicIssue>(
    () => COMPLAINTS.find((c) => c.id === selectedComplaintId) ?? COMPLAINTS[0],
  )
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  // Comments State
  const [newCommentText, setNewCommentText] = useState("")
  const [newCommentAuthor, setNewCommentAuthor] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)

  // Vote State
  const [upvoting, setUpvoting] = useState(false)
  const [downvoting, setDownvoting] = useState(false)

  useEffect(() => {
    if (selectedComplaintId) {
      civicIssueService.getIssueById(selectedComplaintId).then((found) => {
        if (found) setComplaint(found)
      })
    }
  }, [selectedComplaintId])

  const handleUpvote = async () => {
    if (upvoting) return
    setUpvoting(true)
    try {
      const updated = await civicIssueService.upvoteIssue(complaint.id)
      if (updated) setComplaint(updated)
    } finally {
      setUpvoting(false)
    }
  }

  const handleDownvote = async () => {
    if (downvoting) return
    setDownvoting(true)
    try {
      const updated = await civicIssueService.downvoteIssue(complaint.id)
      if (updated) setComplaint(updated)
    } finally {
      setDownvoting(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCommentText.trim()) return

    setIsSubmittingComment(true)
    try {
      const newComment = await civicIssueService.addComment(
        complaint.id,
        newCommentText.trim(),
        newCommentAuthor.trim() || (isTamil ? "குடிமகன்" : "Citizen"),
      )
      setComplaint((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), newComment],
      }))
      setNewCommentText("")
      setCommentSuccess(true)
      setTimeout(() => setCommentSuccess(false), 3000)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const submittedDate = new Date(complaint.submittedAt).toLocaleDateString(
    lang === "ta" ? "ta-IN" : "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  )
  const updatedDate = new Date(complaint.updatedAt).toLocaleDateString(
    lang === "ta" ? "ta-IN" : "en-IN",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  )

  const isResolved = complaint.status === "resolved"

  return (
    <main
      id="main-content"
      className="max-w-4xl mx-auto px-4 py-8 animate-fade-in space-y-6"
    >
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-semibold text-[#64748b]"
      >
        <button
          onClick={() => navigate("home")}
          className="hover:text-[#1c3a6e] transition-colors"
        >
          {tr.nav.home}
        </button>
        <span>/</span>
        <button
          onClick={() => navigate("map")}
          className="hover:text-[#1c3a6e] transition-colors"
        >
          {tr.nav.map}
        </button>
        <span>/</span>
        <code className="text-[#1c3a6e] font-bold">{complaint.id}</code>
      </nav>

      {/* Hero Issue Card */}
      <div className="bg-white border border-[#d0d5e2] rounded-2xl p-6 civic-shadow space-y-5">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-14 h-14 bg-[#e8eef8] rounded-2xl flex items-center justify-center text-[#1c3a6e] flex-shrink-0 text-2xl">
            {CATEGORY_ICONS[complaint.category]}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
              <h1
                className={`text-xl font-bold text-[#0c1a30] ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {isTamil && complaint.titleTa ? complaint.titleTa : complaint.title}
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-gray-100 text-[#1c3a6e] rounded-lg border border-gray-200">
                {complaint.id}
              </span>
            </div>

            <p
              className={`text-xs text-[#64748b] mb-3 flex items-center gap-1 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              <span>📍</span> {complaint.address}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={complaint.status} lang={lang} />
              <PriorityBadge priority={complaint.priority} lang={lang} />
              <SLABadge
                hoursRemaining={complaint.slaRemainingHours}
                breached={complaint.slaBreached}
                lang={lang}
              />
              {complaint.isFakeImage === false && (
                <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold">
                  🛡️ Authentic Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Community Actions: Upvote & Downvote Bar */}
        <div className="p-3 bg-[#f8fafc] border border-gray-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700">
              {isTamil ? "குடிமக்கள் ஆதரவு:" : "Community Vote:"}
            </span>
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoting}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                complaint.userVote === "up"
                  ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-emerald-50 hover:border-emerald-400"
              }`}
            >
              <span>👍</span>
              <span>{isTamil ? "ஆதரவு" : "Upvote"}</span>
              <span className="ml-1 font-mono font-bold bg-black/10 px-1.5 py-0.2 rounded-full">
                {complaint.upvotes || 1}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownvote}
              disabled={downvoting}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                complaint.userVote === "down"
                  ? "bg-red-600 text-white border-red-700 shadow-sm"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-red-50 hover:border-red-400"
              }`}
            >
              <span>👎</span>
              <span>{isTamil ? "எதிர்ப்பு" : "Downvote"}</span>
              <span className="ml-1 font-mono font-bold bg-black/10 px-1.5 py-0.2 rounded-full">
                {complaint.downvotes || 0}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>👥 {complaint.reportsCount || 1} {isTamil ? "அறிக்கைகள்" : "Reports"}</span>
            <span>💬 {(complaint.comments || []).length} {isTamil ? "கருத்துகள்" : "Comments"}</span>
            <button
              type="button"
              onClick={() => generateCivicReportPDF(complaint, lang)}
              className="ml-auto px-3.5 py-1.5 bg-[#cf6009] hover:bg-[#b55206] text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all text-xs"
            >
              <span>📥</span>
              <span>{isTamil ? "PDF பதிவிறக்குக" : "Download PDF Report"}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {complaint.tags && complaint.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {complaint.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-blue-50 text-[#1c3a6e] border border-blue-200 rounded-lg text-xs font-semibold"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Photographic Evidence: Before and After Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Before Photo */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
            <img
              src={getBeforeImage(complaint)}
              alt="Before Incident"
              className="w-full h-56 object-cover"
            />
            <div className="p-2.5 bg-white border-t border-gray-200 flex items-center justify-between text-xs">
              <span className="font-bold text-red-700 flex items-center gap-1">
                <span>📸</span> {isTamil ? "ஆரம்ப புகைப்படம் (BEFORE)" : "Incident Photo (BEFORE)"}
              </span>
              <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded">
                Verified Site Evidence
              </span>
            </div>
          </div>

          {/* After Photo Proof */}
          <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl overflow-hidden shadow-xs">
            {isResolved || complaint.resolvedImageUrl ? (
              <img
                src={getAfterImage(complaint)}
                alt="After Resolution Proof"
                className="w-full h-56 object-cover"
              />
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-gray-400 text-xs p-4 text-center">
                <span className="text-3xl mb-1.5">⏳</span>
                <span className="font-bold text-gray-700 text-sm">
                  {isTamil ? "கள ஆய்வு & தீர்வு செயல்பாட்டில் உள்ளது" : "Resolution Work in Progress"}
                </span>
                <span className="text-[11px] text-gray-500 mt-1 max-w-xs leading-relaxed">
                  After photo proof will be uploaded once field officer completes repair on site.
                </span>
              </div>
            )}
            <div className="p-2.5 bg-white border-t border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <span>✓</span> {isTamil ? "தீர்வு ஆதாரம் (AFTER PHOTO)" : "Resolution Proof (AFTER)"}
              </span>
              <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded">
                {isResolved ? "Officer Verified" : "Pending Verification"}
              </span>
            </div>
          </div>
        </div>

        {/* Resolution Notes Banner if present */}
        {complaint.resolutionNotes && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
            <div className="font-bold text-emerald-800 flex items-center gap-1.5">
              <span>🛠️</span>
              <span>Official Resolution Notes:</span>
            </div>
            <p className="text-emerald-950 font-medium leading-relaxed">
              {complaint.resolutionNotes}
            </p>
          </div>
        )}
      </div>

      {/* Grid: Details & Map */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Description */}
        <div className="md:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-5 civic-shadow space-y-3">
            <h2
              className={`text-xs font-bold text-gray-400 uppercase tracking-wider ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {isTamil ? "பிரச்சினை விளக்கம்" : "Detailed Description"}
            </h2>
            <p className="text-xs text-gray-800 leading-relaxed">
              {isTamil && complaint.descriptionTa
                ? complaint.descriptionTa
                : complaint.description}
            </p>
          </div>

          {/* Department & Administrative Grid */}
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-5 civic-shadow">
            <h2
              className={`text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {tr.complaint.detailsHeading}
            </h2>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 font-medium">{tr.complaint.category}</dt>
                <dd className="font-bold text-gray-900 text-right">
                  {tr.services[complaint.category]?.name || complaint.category}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100 items-start">
                <dt className="text-gray-500 font-medium">
                  {isTamil ? "புகார்தாரர் விவரம்" : "Reported By"}
                </dt>
                <dd className="font-bold text-gray-900 text-right">
                  {complaint.anonymous ? (
                    <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      <span>🕶️</span> {isTamil ? "அநாமதேய குடிமகன்" : "Anonymous Citizen"}
                    </span>
                  ) : (
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        <span>✓</span> {complaint.citizenName || (isTamil ? "சரிபார்க்கப்பட்ட குடிமகன்" : "Verified Citizen")}
                      </span>
                      {(complaint.citizenPhone || complaint.citizenMobile) && (
                        <div className="text-[11px] font-mono text-gray-500">
                          📱 +91 {complaint.citizenPhone || complaint.citizenMobile}
                        </div>
                      )}
                    </div>
                  )}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 font-medium">{tr.complaint.department}</dt>
                <dd className="font-bold text-gray-900 text-right">
                  {isTamil ? complaint.departmentTa : complaint.department}
                </dd>
              </div>


              <div className="flex justify-between py-2 border-b border-gray-100 items-start">
                <dt className="text-gray-500 font-medium">{tr.complaint.officer}</dt>
                <dd className="font-bold text-gray-900 text-right">
                  {complaint.officer ? (
                    <div className="space-y-1">
                      <span className="text-emerald-700 block">👤 {complaint.officer}</span>
                      {(() => {
                        const off = OFFICERS.find((o) => o.name === complaint.officer) || OFFICERS[0]
                        const phone = off.phone || "8940707924"
                        const msg = `🚨 *CivicAI Grievance Followup*\n\n*Complaint ID:* ${complaint.id}\n*Title:* ${complaint.title}\n*Location:* ${complaint.address}`

                        return (
                          <div className="flex items-center justify-end gap-1.5 text-[10px]">
                            <a
                              href={`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold"
                            >
                              💬 WhatsApp
                            </a>
                            <a
                              href={`sms:+91${phone}?body=${encodeURIComponent(msg)}`}
                              className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold"
                            >
                              📱 SMS
                            </a>
                            <span className="font-mono text-gray-400">{phone}</span>
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400 font-normal">{tr.complaint.notAssigned}</span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 font-medium">{isTamil ? "மாநிலம் / மாவட்டம்" : "State / District"}</dt>
                <dd className="font-bold text-gray-900 text-right">
                  {complaint.district}, {complaint.state}
                </dd>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-100">
                <dt className="text-gray-500 font-medium">{tr.complaint.submitted}</dt>
                <dd className="font-bold text-gray-900 text-right">{submittedDate}</dd>
              </div>

              <div className="flex justify-between py-2">
                <dt className="text-gray-500 font-medium">{tr.complaint.updated}</dt>
                <dd className="font-bold text-gray-900 text-right">{updatedDate}</dd>
              </div>
            </dl>
          </div>


          {/* Interactive Map of this complaint with 100m radius circle */}
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 civic-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>🗺️</span>
                <span>{isTamil ? "இருப்பிட வரைபடம் (100மீ ஆரம்)" : "Location Map (100m Radius)"}</span>
              </h2>
              <span className="text-[11px] font-mono text-gray-500">
                {complaint.lat.toFixed(4)}, {complaint.lng.toFixed(4)}
              </span>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <CivicMap
                height="260px"
                initialCenter={[complaint.lng, complaint.lat]}
                initialZoom={15}
                enableHeatmapToggle={false}
                enableFilters={false}
                enableSearch={false}
                enableRadiusControl={false}
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Timeline & AI Intelligence */}
        <div className="space-y-6">
          {/* AI Vision Card */}
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-5 civic-shadow space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-[#0a6e5f] text-white rounded-md font-bold">
                AI Vision
              </span>
              <span className="text-xs font-semibold text-gray-600">
                Confidence: {complaint.aiConfidence || 90}%
              </span>
            </div>
            <div className="text-xs space-y-2 pt-1">
              <div>
                <span className="text-gray-400 font-semibold">Category:</span>
                <p className="font-bold text-gray-900 capitalize">
                  {complaint.category}
                </p>
              </div>
              <div>
                <span className="text-gray-400 font-semibold">Severity:</span>
                <p className="font-bold text-red-600 uppercase">
                  {complaint.priority}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-5 civic-shadow">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
              {tr.complaint.timeline}
            </h2>
            <ol className="space-y-0 text-xs">
              {(complaint.timeline || []).map((event, i) => {
                const isLast = i === (complaint.timeline || []).length - 1
                return (
                  <li
                    key={i}
                    className="flex gap-3 pb-4 last:pb-0 relative"
                  >
                    {!isLast && (
                      <div
                        className={`absolute left-[11px] top-5 bottom-0 w-0.5 ${
                          event.done ? "bg-[#1c3a6e]" : "bg-[#d0d5e2]"
                        }`}
                      />
                    )}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center z-10 ${
                        event.done
                          ? "bg-[#1c3a6e] text-white font-bold"
                          : "bg-white border-2 border-[#d0d5e2] text-transparent"
                      }`}
                    >
                      {event.done ? "✓" : "•"}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p
                        className={`font-semibold ${
                          event.done ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {isTamil && event.labelTa ? event.labelTa : event.label}
                      </p>
                      {event.timestamp && (
                        <p className="text-[10px] text-gray-400">
                          {new Date(event.timestamp).toLocaleDateString(
                            isTamil ? "ta-IN" : "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Interactive Comments & Discussions Section */}
      <section className="bg-white border border-[#d0d5e2] rounded-2xl p-6 civic-shadow space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>💬</span>
            <span>
              {isTamil
                ? `குடிமக்கள் கருத்துகள் (${(complaint.comments || []).length})`
                : `Citizen Comments & Discussion (${(complaint.comments || []).length})`}
            </span>
          </h2>
          <span className="text-xs text-gray-400 font-semibold">
            {isTamil ? "நேரடி தரவுத்தளம்" : "Live Database Sync"}
          </span>
        </div>

        {/* Existing Comments List */}
        <div className="space-y-3">
          {(!complaint.comments || complaint.comments.length === 0) ? (
            <div className="p-6 text-center text-xs text-gray-500 bg-[#f8fafc] rounded-xl border border-gray-100">
              {isTamil
                ? "இதுவரை கருத்துகள் இல்லை. முதல் கருத்தைப் பதிவு செய்யுங்கள்!"
                : "No comments yet. Be the first citizen to leave feedback or updates!"}
            </div>
          ) : (
            complaint.comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-[#f8fafc] rounded-xl border border-gray-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#1c3a6e] text-white rounded-full flex items-center justify-center font-bold text-xs">
                      {comment.userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-900">
                      {comment.userName}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleDateString(
                      isTamil ? "ta-IN" : "en-IN",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
                <p className="text-gray-800 pl-9 leading-relaxed">
                  {comment.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="pt-3 border-t border-gray-100 space-y-3">
          <div className="font-bold text-xs text-gray-800">
            {isTamil ? "உங்கள் கருத்தை பதிவு செய்யவும்:" : "Add Your Comment / Update:"}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newCommentAuthor}
              onChange={(e) => setNewCommentAuthor(e.target.value)}
              placeholder={isTamil ? "உங்கள் பெயர் (விரும்பினால்)" : "Your Name (Optional)"}
              className="px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
            />
          </div>

          <textarea
            rows={3}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              isTamil
                ? "இந்த பிரச்சினை குறித்த உங்கள் கருத்து அல்லது களநிலவரத்தை உள்ளிடவும்..."
                : "Enter your comment, ground update, or resolution observation..."
            }
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
          />

          <div className="flex items-center justify-between">
            {commentSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                ✓ {isTamil ? "கருத்து சேமிக்கப்பட்டது!" : "Comment posted successfully!"}
              </span>
            )}
            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmittingComment}
              className="ml-auto px-5 py-2.5 bg-[#1c3a6e] hover:bg-[#102244] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              {isSubmittingComment ? "..." : isTamil ? "கருத்தை பதிவேற்றுக →" : "Post Comment →"}
            </button>
          </div>
        </form>
      </section>

      {/* Resolution Feedback (if resolved) */}
      {isResolved && !feedbackSubmitted && (
        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-5 civic-shadow space-y-4">
          <h2 className="font-bold text-sm text-[#0c1a30]">
            {tr.feedback.wasResolved}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFeedbackGiven(true)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                feedbackGiven === true
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 hover:border-emerald-400"
              }`}
            >
              {tr.feedback.yesResolved}
            </button>
            <button
              type="button"
              onClick={() => setFeedbackGiven(false)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl border-2 transition-all ${
                feedbackGiven === false
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-300 hover:border-red-400"
              }`}
            >
              {tr.feedback.notResolved}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
