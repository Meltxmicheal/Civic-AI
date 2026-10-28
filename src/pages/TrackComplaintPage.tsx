import { useState } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { civicIssueService } from "../services/civicIssueService.ts"
import { COMPLAINTS } from "../data/civicData.ts"

type TrackState = "idle" | "loading" | "found" | "not_found" | "too_many" | "error"

export function TrackComplaintPage() {
  const { lang, navigate } = useApp()
  const tr = t[lang].track
  const [complaintId, setComplaintId] = useState("")
  const [pin, setPin] = useState("")
  const [state, setState] = useState<TrackState>("idle")
  const [attempts, setAttempts] = useState(0)

  const handleTrack = async () => {
    if (!complaintId.trim() || !pin.trim()) return
    if (attempts >= 5) {
      setState("too_many")
      return
    }
    setState("loading")
    try {
      const found = await civicIssueService.getIssueById(complaintId.trim())
      if (found) {
        setAttempts(0)
        navigate("complaint-detail", found.id)
      } else {
        setAttempts((a) => a + 1)
        if (attempts + 1 >= 5) setState("too_many")
        else setState("not_found")
      }
    } catch (err) {
      setState("not_found")
    }
  }

  return (
    <main
      id="main-content"
      className="max-w-lg mx-auto px-4 py-10 animate-fade-in"
    >
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#e8eef8] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1c3a6e"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <h1
          className={`text-2xl font-bold text-[#0c1a30] mb-2 ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.heading}
        </h1>
        <p
          className={`text-[#64748b] text-sm ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {tr.subheading}
        </p>
      </div>

      <div className="bg-white border border-[#d0d5e2] rounded-xl p-6 civic-shadow">
        <div className="space-y-4 mb-5">
          <div>
            <label
              className={`block text-sm font-medium text-[#334155] mb-1.5 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
              htmlFor="cid"
            >
              {tr.idLabel}
            </label>
            <input
              id="cid"
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value.toUpperCase())}
              placeholder={tr.idPlaceholder}
              className="w-full border border-[#d0d5e2] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0c1a30] focus:outline-none focus:border-[#1c3a6e] focus:ring-1 focus:ring-[#1c3a6e] uppercase"
              autoComplete="off"
              aria-describedby={
                state === "not_found" ? "track-error" : undefined
              }
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium text-[#334155] mb-1.5 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
              htmlFor="pin"
            >
              {tr.pinLabel}
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder={tr.pinPlaceholder}
              className="w-full border border-[#d0d5e2] rounded-lg px-3 py-2.5 text-sm font-mono text-[#0c1a30] focus:outline-none focus:border-[#1c3a6e] focus:ring-1 focus:ring-[#1c3a6e] tracking-widest"
              aria-describedby={
                state === "not_found" ? "track-error" : undefined
              }
            />
          </div>
        </div>

        {state === "not_found" && (
          <div
            id="track-error"
            role="alert"
            className="mb-4 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b91c1c"
              strokeWidth="2"
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <p
              className={`text-sm text-red-700 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.notFound}
            </p>
          </div>
        )}
        {state === "too_many" && (
          <div
            role="alert"
            className="mb-4 flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#b45309"
              strokeWidth="2"
              className="flex-shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p
              className={`text-sm text-amber-700 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.tooManyAttempts}
            </p>
          </div>
        )}

        <button
          onClick={handleTrack}
          disabled={
            !complaintId.trim() ||
            pin.length < 6 ||
            state === "loading" ||
            state === "too_many"
          }
          className={`w-full py-3 text-sm font-semibold text-white bg-[#1c3a6e] rounded-lg hover:bg-[#102244] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
            lang === "ta" ? "font-tamil" : ""
          }`}
        >
          {state === "loading" ? (
            <>
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              <span className={lang === "ta" ? "font-tamil" : ""}>
                {tr.searching}
              </span>
            </>
          ) : (
            tr.cta
          )}
        </button>

        <div className="mt-5 pt-4 border-t border-[#f4f6fa]">
          <p
            className={`text-xs text-center text-[#64748b] mb-3 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.samplePrompt}
          </p>
          <div className="space-y-2">
            {COMPLAINTS.slice(0, 3).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setComplaintId(c.id)
                  setPin("123456")
                }}
                className="w-full text-left px-3 py-2 border border-[#d0d5e2] rounded-lg hover:bg-[#f4f6fa] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <code className="text-xs font-mono text-[#1c3a6e]">
                    {c.id}
                  </code>
                  <span
                    className={`text-xs text-[#64748b] ${
                      lang === "ta" ? "font-tamil" : ""
                    }`}
                  >
                    {lang === "ta" ? c.titleTa : c.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p
        className={`text-center text-xs text-[#94a3b8] mt-4 ${
          lang === "ta" ? "font-tamil" : ""
        }`}
      >
        {tr.pinHelpNote}
      </p>
    </main>
  )
}
