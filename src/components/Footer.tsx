import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"

export function Footer() {
  const { lang, navigate } = useApp()
  const tr = t[lang].footer

  return (
    <footer className="bg-[#0c1a30] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-white/10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 2L3 7v10l9 5 9-5V7z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 2v20M3 7l9 5 9-5"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="12" r="2" fill="#cf6009" />
                </svg>
              </div>
              <span className="font-bold text-lg">CivicAI</span>
            </div>
            <p
              className={`text-sm text-white/70 mb-1 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.tagline}
            </p>
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p
                className={`text-xs font-medium text-[#cf6009] mb-0.5 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.helpline}
              </p>
              <p
                className={`text-xs text-white/50 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.helplineNote}
              </p>
            </div>
          </div>

          {/* Links col 1: Platform */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.platformHeading}
            </h3>
            <ul className="space-y-2">
              {[
                { label: tr.about, action: () => {} },
                { label: tr.services, action: () => navigate("home") },
                { label: tr.departments, action: () => navigate("department") },
                {
                  label: tr.transparency,
                  action: () => navigate("transparency"),
                },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button
                    onClick={action}
                    className={`text-sm text-white/60 hover:text-white transition-colors text-left ${
                      lang === "ta" ? "font-tamil" : ""
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links col 2: Services */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.servicesHeading}
            </h3>
            <ul className="space-y-2">
              {[
                { label: tr.reportIssue, action: () => navigate("report") },
                { label: tr.trackComplaint, action: () => navigate("track") },
                { label: tr.civicMap, action: () => navigate("map") },
                { label: tr.aiAssistant, action: () => {} },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button
                    onClick={action}
                    className={`text-sm text-white/60 hover:text-white transition-colors text-left ${
                      lang === "ta" ? "font-tamil" : ""
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Links col 3: Legal */}
          <div>
            <h3
              className={`text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.legalHeading}
            </h3>
            <ul className="space-y-2">
              {[
                tr.accessibility,
                tr.privacy,
                tr.terms,
                tr.security,
                tr.sitemap,
              ].map((label) => (
                <li key={label}>
                  <button
                    className={`text-sm text-white/60 hover:text-white transition-colors text-left ${
                      lang === "ta" ? "font-tamil" : ""
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p
            className={`text-xs text-white/40 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.copyright}
          </p>
          <p
            className={`text-xs text-white/30 text-center sm:text-right max-w-sm ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.disclaimer}
          </p>
        </div>
      </div>
    </footer>
  )
}
