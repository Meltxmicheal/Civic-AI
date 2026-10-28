import { useState } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { CATEGORY_ICONS } from "./CategoryIcons"
import type { Category, Priority } from "../types"
import type { CombinedAIAnalysisResult, AIRequestState } from "../ai/types"

export interface AIAnalysisCardProps {
  analysis: CombinedAIAnalysisResult | null
  state: AIRequestState
  errorMessage?: string
  errorMessageTa?: string
  selectedCategory: Category | null
  onCategorySelected: (cat: Category) => void
  onConfirm: () => void
  onRetry: () => void
  onReplaceImage: () => void
}

const ALL_CATEGORIES: Category[] = [
  "road",
  "garbage",
  "streetlight",
  "water",
  "drainage",
  "traffic",
  "parks",
  "buildings",
  "other",
]

export function AIAnalysisCard({
  analysis,
  state,
  errorMessage,
  errorMessageTa,
  selectedCategory,
  onCategorySelected,
  onConfirm,
  onRetry,
  onReplaceImage,
}: AIAnalysisCardProps) {
  const { lang } = useApp()
  const tr = t[lang].aiCard
  const common = t[lang].common
  const isTamil = lang === "ta"
  const [isChangingCategory, setIsChangingCategory] = useState<boolean>(false)

  // 1. Loading / Analyzing State
  if (
    state === "validating" ||
    state === "uploading" ||
    state === "analyzing"
  ) {
    return (
      <div className="bg-gradient-to-br from-[#f8fafc] to-[#e8eef8] border border-[#1c3a6e]/20 rounded-2xl p-6 sm:p-8 text-center animate-fade-in shadow-sm">
        <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#1c3a6e]/20 border-t-[#1c3a6e] animate-spin" />
          <div className="w-10 h-10 bg-[#1c3a6e] text-white rounded-full flex items-center justify-center font-bold text-xs shadow-inner">
            AI
          </div>
        </div>

        <h3
          className={`text-base font-bold text-[#0c1a30] mb-1.5 ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          {isTamil
            ? "AI மூலம் புகைப்படம் மற்றும் இருப்பிடம் பகுப்பாய்வு செய்யப்படுகிறது..."
            : "Analyzing Image with Civic AI Vision..."}
        </h3>
        <p
          className={`text-xs text-[#64748b] max-w-sm mx-auto leading-relaxed ${
            isTamil ? "font-tamil" : ""
          }`}
        >
          {isTamil
            ? "புகைப்படத்தின் உண்மைத்தன்மை, பிரச்சினை வகை, தீவிரம், துறை மற்றும் குறிச்சொற்களை கண்டறிகிறோம்."
            : "Checking image authenticity, civic category, severity, responsible department, and generating smart tags."}
        </p>

        {/* Skeleton Bars */}
        <div className="max-w-xs mx-auto mt-6 space-y-2.5">
          <div className="h-3 bg-[#cbd5e1] rounded-full animate-pulse w-4/5 mx-auto" />
          <div className="h-3 bg-[#cbd5e1] rounded-full animate-pulse w-3/5 mx-auto" />
        </div>
      </div>
    )
  }

  // 2. Error / Timeout / Rate Limit State
  if (
    state === "timeout" ||
    state === "rateLimited" ||
    state === "serverError" ||
    state === "networkError" ||
    state === "invalidImage"
  ) {
    const message =
      isTamil && errorMessageTa
        ? errorMessageTa
        : errorMessage || tr.genericError

    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 animate-fade-in shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h3
              className={`text-sm font-bold text-amber-900 mb-1 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {state === "timeout"
                ? tr.timeoutTitle
                : state === "rateLimited"
                  ? tr.rateLimitedTitle
                  : tr.errorTitle}
            </h3>
            <p
              className={`text-xs text-amber-800 leading-relaxed ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-amber-200">
          <button
            type="button"
            onClick={onRetry}
            className={`w-full sm:w-auto min-h-[44px] px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {common.retry}
          </button>
          <button
            type="button"
            onClick={() => setIsChangingCategory(true)}
            className={`w-full sm:w-auto min-h-[44px] px-4 py-2 bg-white hover:bg-amber-100/50 text-amber-900 border border-amber-300 text-xs font-semibold rounded-lg transition-colors ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {tr.selectCategoryManually}
          </button>
        </div>

        {/* Manual Category Selection */}
        {isChangingCategory && (
          <div className="mt-5 pt-4 border-t border-amber-200 animate-fade-in">
            <h4
              className={`text-xs font-bold text-[#0c1a30] mb-3 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {tr.chooseCategory}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      onCategorySelected(cat)
                      setIsChangingCategory(false)
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? "border-[#1c3a6e] bg-[#e8eef8] font-bold text-[#1c3a6e]"
                        : "border-[#d0d5e2] bg-white text-[#0c1a30] hover:border-[#1c3a6e]/40"
                    }`}
                  >
                    <div className="text-[#1c3a6e] mb-1">
                      {CATEGORY_ICONS[cat]}
                    </div>
                    <p className={isTamil ? "font-tamil" : ""}>
                      {t[lang].services[cat].name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // 3. Non-Civic Image Detected State
  if (analysis && !analysis.isCivicIssue) {
    return (
      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-6 animate-fade-in shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 15h8M9 9h.01M15 9h.01" />
            </svg>
          </div>
          <div>
            <h3
              className={`text-sm font-bold text-slate-900 mb-1 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {isTamil
                ? "இந்தப் படத்தில் குடிமைப் பிரச்சினையை தெளிவாகக் கண்டறிய முடியவில்லை."
                : "We couldn't identify a civic issue in this image."}
            </h3>
            <p
              className={`text-xs text-slate-600 leading-relaxed ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {isTamil
                ? "சாலை, குப்பை, விளக்கு, வடிகால் போன்ற நகராட்சி சேவைகள் சார்ந்த புகார்களுக்கு வேறு புகைப்படத்தைப் பதிவேற்றலாம் அல்லது விவரத்தை உள்ளிட்டு தொடரலாம்."
                : "CivicAI could not detect public infrastructure damage in this photo. You can try uploading another photo or describe the issue manually."}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onReplaceImage}
            className={`w-full sm:w-auto min-h-[44px] px-4 py-2 bg-[#1c3a6e] hover:bg-[#102244] text-white text-xs font-semibold rounded-lg transition-colors ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {tr.tryAnotherImage}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsChangingCategory(true)
              onCategorySelected("other")
            }}
            className={`w-full sm:w-auto min-h-[44px] px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition-colors ${
              isTamil ? "font-tamil" : ""
            }`}
          >
            {tr.continueWithDescription}
          </button>
        </div>
      </div>
    )
  }

  // 4. Successful AI Analysis Recommendation State
  if (analysis) {
    const priorityColors: Record<Priority, {
      bg: string
      text: string
      border: string
    }> = {
      critical: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-300",
      },
      high: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        border: "border-orange-300",
      },
      medium: {
        bg: "bg-amber-100",
        text: "text-amber-800",
        border: "border-amber-300",
      },
      low: {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        border: "border-emerald-300",
      },
    }

    const currentCategoryKey = selectedCategory || analysis.categoryKey
    const detectedIssue =
      isTamil && analysis.detectedEntityTa ? analysis.detectedEntityTa : analysis.detectedEntity
    const reason =
      isTamil && analysis.severityReasonTa ? analysis.severityReasonTa : analysis.severityReason
    const department =
      isTamil && analysis.suggestedDepartmentTa
        ? analysis.suggestedDepartmentTa
        : analysis.suggestedDepartment
    const pStyle =
      priorityColors[(analysis.severity as Priority)] || priorityColors.high

    return (
      <div className="bg-white border-2 border-[#1c3a6e]/30 rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in space-y-4">
        {/* Header Badges: Gemini AI + Authenticity + Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-[#0a6e5f] text-white rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Civic AI Analysis</span>
            </span>

            {/* Authenticity Verification Badge */}
            {analysis.isFakeImage ? (
              <span className="text-xs px-2.5 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-full font-semibold flex items-center gap-1">
                ⚠️ {isTamil ? "செயற்கை/போலி படம்" : "Synthetic / Manipulated Photo"}
              </span>
            ) : (
              <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-semibold flex items-center gap-1">
                🛡️ {isTamil ? "உண்மையான புகைப்படம் சரிபார்க்கப்பட்டது" : "Authentic Photo Verified"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-[#1c3a6e] bg-[#e8eef8] px-2.5 py-1 rounded-full">
            <span>{tr.confidence}:</span>
            <span className="font-bold">{analysis.confidence}%</span>
          </div>
        </div>

        {/* AI Analysis Findings Grid */}
        <div className="space-y-3">
          {/* Detected Issue & Smart Title */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
            <p
              className={`text-[11px] font-medium text-[#64748b] mb-1 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {isTamil ? "தானாக உருவாக்கப்பட்ட தலைப்பு" : "AI Generated Title"}
            </p>
            <div className="flex items-center gap-2">
              <div className="text-[#1c3a6e]">
                {CATEGORY_ICONS[currentCategoryKey]}
              </div>
              <p
                className={`text-sm font-bold text-[#0c1a30] ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {isTamil && analysis.smartTitleTa ? analysis.smartTitleTa : analysis.smartTitle || detectedIssue}
              </p>
            </div>
          </div>

          {/* Severity & Department Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Severity */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
              <p
                className={`text-[11px] font-medium text-[#64748b] mb-1 ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.severityLabel}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
                >
                  {analysis.severity}
                </span>
              </div>
              <p
                className={`text-[11px] text-[#475569] mt-2 italic leading-relaxed ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                "{reason}"
              </p>
            </div>

            {/* Suggested Department */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5">
              <p
                className={`text-[11px] font-medium text-[#64748b] mb-1 ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.suggestedDepartmentLabel}
              </p>
              <p
                className={`text-xs font-bold text-[#0c1a30] ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {department}
              </p>
              <p
                className={`text-[10px] text-[#64748b] mt-1 ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.routingConfidence}: {analysis.departmentConfidence}%
              </p>
            </div>
          </div>

          {/* AI Auto-Generated Tags */}
          {analysis.tags && analysis.tags.length > 0 && (
            <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
              <div className="text-[11px] font-medium text-[#64748b] mb-1.5">
                🏷️ {isTamil ? "தானியங்கி குறிச்சொற்கள்" : "AI Generated Tags"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-blue-50 text-[#1c3a6e] border border-blue-200 rounded-md text-[11px] font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation & Continue Banner */}
        <div className="bg-[#f0f4fa] border border-[#1c3a6e]/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p
                className={`text-xs font-bold text-[#0c1a30] ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.isThisCorrectPrompt}
              </p>
              <p
                className={`text-[11px] text-[#64748b] ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.categoryLabel}:{" "}
                <span className="font-semibold text-[#1c3a6e]">
                  {t[lang].services[currentCategoryKey].name}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsChangingCategory(!isChangingCategory)}
                className={`min-h-[44px] flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold text-[#1c3a6e] bg-white border border-[#d0d5e2] hover:bg-[#e8eef8] rounded-lg transition-colors ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {isChangingCategory ? tr.keepRecommendation : tr.changeCategory}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className={`min-h-[44px] flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-white bg-[#1c3a6e] hover:bg-[#102244] rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                <span>{tr.yesContinue}</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Manual Category Override Drawer */}
          {isChangingCategory && (
            <div className="mt-4 pt-3 border-t border-[#1c3a6e]/20 animate-fade-in">
              <p
                className={`text-xs font-semibold text-[#334155] mb-2.5 ${
                  isTamil ? "font-tamil" : ""
                }`}
              >
                {tr.selectCorrectCategory}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const isSelected = currentCategoryKey === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        onCategorySelected(cat)
                        setIsChangingCategory(false)
                      }}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        isSelected
                          ? "border-[#1c3a6e] bg-[#e8eef8] font-bold text-[#1c3a6e]"
                          : "border-[#d0d5e2] bg-white text-[#0c1a30] hover:border-[#1c3a6e]/40"
                      }`}
                    >
                      <div className="text-[#1c3a6e] mb-1">
                        {CATEGORY_ICONS[cat]}
                      </div>
                      <p className={`line-clamp-1 ${isTamil ? "font-tamil" : ""}`}>
                        {t[lang].services[cat].name}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
