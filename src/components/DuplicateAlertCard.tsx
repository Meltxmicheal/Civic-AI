import { useState } from "react"
import { useApp } from "../contexts/AppContext.tsx"
import { t } from "../i18n/translations.ts"
import { civicIssueService } from "../services/civicIssueService.ts"
import type { CivicIssue } from "../types/index.ts"

interface DuplicateAlertCardProps {
  matchedIssue: CivicIssue
  distanceMeters: number
  similarityReason?: string
  similarityReasonTa?: string
  onContinueAsDifferentIssue: () => void
  onSupportSuccess: (updatedIssue: CivicIssue) => void
}

export function DuplicateAlertCard({
  matchedIssue,
  distanceMeters,
  similarityReason,
  similarityReasonTa,
  onContinueAsDifferentIssue,
  onSupportSuccess,
}: DuplicateAlertCardProps) {
  const { lang, navigate } = useApp()
  const isTamil = lang === "ta"

  const [upvoted, setUpvoted] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [commentSuccess, setCommentSuccess] = useState(false)
  const [supporters, setSupporters] = useState(
    matchedIssue.supportersCount || 1,
  )
  const [upvoting, setUpvoting] = useState(false)

  const handleUpvote = async () => {
    if (upvoted || upvoting) return
    setUpvoting(true)
    try {
      const updated = await civicIssueService.upvoteIssue(matchedIssue.id)
      setUpvoted(true)
      setSupporters((prev) => prev + 1)
      if (updated) {
        onSupportSuccess(updated)
      }
    } catch (err) {
      console.error("Upvote failed:", err)
    } finally {
      setUpvoting(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || commentSubmitting) return

    setCommentSubmitting(true)
    try {
      await civicIssueService.addComment(
        matchedIssue.id,
        commentText.trim(),
        "Citizen",
      )
      setCommentSuccess(true)
      setCommentText("")
    } catch (err) {
      console.error("Comment failed:", err)
    } finally {
      setCommentSubmitting(false)
    }
  }

  return (
    <div
      className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/90 shadow-sm animate-fade-in my-4"
      role="alert"
      aria-live="polite"
    >
      {/* Header Banner */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-lg shadow-sm">
          ⚠️
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
              {isTamil
                ? "சாத்தியமான நகல் கண்டறியப்பட்டது"
                : "Potential Duplicate Detected"}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
              📍 {distanceMeters}m {isTamil ? "தொலைவில்" : "away"}
            </span>
          </div>
          <h3
            className={`text-base font-bold text-amber-950 mt-1 ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {isTamil
              ? "இதே போன்ற ஒரு பிரச்சினை அருகில் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது."
              : "A similar issue has already been reported nearby."}
          </h3>
          <p
            className={`text-xs text-amber-800 mt-0.5 ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {isTamil
              ? similarityReasonTa ||
                `${distanceMeters} மீட்டர் தொலைவில் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது.`
              : similarityReason ||
                `Found an active report within ${distanceMeters} meters.`}
          </p>
        </div>
      </div>

      {/* Matched Issue Details Card */}
      <div className="bg-white rounded-xl p-4 border border-amber-200 mb-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="text-xs font-semibold text-[#1c3a6e] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
            #{matchedIssue.id}
          </span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 capitalize">
            {matchedIssue.status.replace("_", " ")}
          </span>
        </div>

        <h4
          className={`text-sm font-bold text-[#0c1a30] mb-1 ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          {isTamil
            ? matchedIssue.titleTa || matchedIssue.title
            : matchedIssue.title}
        </h4>
        <p className="text-xs text-[#64748b] line-clamp-2 mb-2">
          {isTamil
            ? matchedIssue.descriptionTa || matchedIssue.description
            : matchedIssue.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-[#64748b] pt-2 border-t border-gray-100 flex-wrap">
          <span>
            👥 {matchedIssue.reportsCount || 1}{" "}
            {isTamil ? "அறிக்கைகள்" : "reports"}
          </span>
          <span>
            ⭐ {supporters} {isTamil ? "ஆதரவாளர்கள்" : "supporters"}
          </span>
          <span>
            🏢{" "}
            {isTamil
              ? matchedIssue.departmentTa || matchedIssue.department
              : matchedIssue.department}
          </span>
        </div>
      </div>

      {/* Action Prompts */}
      <p
        className={`text-xs font-semibold text-amber-900 mb-3 ${
          isTamil ? "font-tamil" : ""
        }`}
      >
        {isTamil
          ? "இந்த ஏற்கனவே உள்ள புகாரை ஆதரித்து தீர்வு செயல்முறையை விரைவுபடுத்த விரும்புகிறீர்களா?"
          : "Would you like to support this existing report to accelerate its resolution?"}
      </p>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={handleUpvote}
          disabled={upvoted || upvoting}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
            upvoted
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-[#1c3a6e] hover:bg-[#152e57] text-white"
          } ${isTamil ? "font-tamil" : ""}`}
        >
          {upvoted
            ? "✓ " + (isTamil ? "ஆதரிக்கப்பட்டது!" : "Supported!")
            : "👍 " + (isTamil ? "புகாரை ஆதரிக்கவும்" : "Upvote Existing Issue")}
        </button>

        <button
          type="button"
          onClick={() => setCommentOpen(!commentOpen)}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-amber-300 bg-white hover:bg-amber-100/60 text-amber-900 transition-colors ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          💬 {isTamil ? "கருத்து சேர்க்க" : "Add Comment"}
        </button>

        <button
          type="button"
          onClick={() => navigate("track", matchedIssue.id)}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          🔍 {isTamil ? "விவரங்களை பார்க்க" : "View Issue"}
        </button>

        <button
          type="button"
          onClick={onContinueAsDifferentIssue}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-medium text-amber-900 hover:bg-amber-200/60 underline underline-offset-2 ml-auto transition-colors ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          {isTamil
            ? "இது வேறு பிரச்சினை (புதிய புகார் தொடர்க)"
            : "Report as Different Issue →"}
        </button>
      </div>

      {/* Comment Form Expansion */}
      {commentOpen && (
        <form
          onSubmit={handleAddComment}
          className="mt-3 pt-3 border-t border-amber-200/80"
        >
          <label
            className={`block text-xs font-semibold text-amber-950 mb-1 ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {isTamil
              ? "கூடுதல் தகவல்கள் அல்லது புகைப்பட விவரங்களை சேர்க்கவும்:"
              : "Add helpful observations or updates for this issue:"}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={
                isTamil
                  ? "எ.கா., இரவு நேரத்தில் மிகவும் ஆபத்தானது..."
                  : "e.g., Water level is rising near the sidewalk..."
              }
              className="flex-1 px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!commentText.trim() || commentSubmitting}
              className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {commentSubmitting ? "..." : isTamil ? "அனுப்புக" : "Post"}
            </button>
          </div>
          {commentSuccess && (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5 animate-fade-in">
              ✓{" "}
              {isTamil
                ? "உங்கள் கருத்து வெற்றிகரமாக சேர்க்கப்பட்டது!"
                : "Your comment has been added!"}
            </p>
          )}
        </form>
      )}
    </div>
  )
}
