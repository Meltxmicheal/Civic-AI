import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { AccessibilityToolbar } from "./AccessibilityToolbar"
import { GovernmentCircularTicker } from "./GovernmentCircularTicker"
import type { Page, StaffRole } from "../types"
import { opsApi } from "../services/opsApi"

const CITIZEN_NAV_ITEMS: { key: Page; labelEn: string; labelTa: string }[] = [
  { key: "home", labelEn: "Home", labelTa: "முகப்பு" },
  { key: "report", labelEn: "Report Issue", labelTa: "புகாரளிக்க" },
  { key: "track", labelEn: "Track Status", labelTa: "கண்காணிக்க" },
  { key: "map", labelEn: "Civic Map", labelTa: "வரைபடம்" },
  { key: "transparency", labelEn: "Department Leaderboard & Stats", labelTa: "துறை தரவரிசை & புள்ளிவிவரம்" },
]

const ADMIN_EXTRA_NAV_ITEMS: { key: Page; labelEn: string; labelTa: string; roles: StaffRole[] }[] = [
  { key: "admin", labelEn: "Admin Portal", labelTa: "நிர்வாக பலகை", roles: ["admin"] },
  { key: "department", labelEn: "Departments", labelTa: "துறைகள்", roles: ["admin", "department"] },
  { key: "officer", labelEn: "Field Officer", labelTa: "களப் பணியாளர்", roles: ["admin", "officer"] },
  { key: "maintenance", labelEn: "Maintenance Intelligence", labelTa: "பராமரிப்பு நுண்ணறிவு", roles: ["admin", "department", "officer"] },
  { key: "work-orders", labelEn: "Work Orders", labelTa: "பணி ஆணைகள்", roles: ["admin", "department", "officer", "contractor"] },
  { key: "civic-intelligence", labelEn: "Civic Intelligence", labelTa: "குடிமை நுண்ணறிவு", roles: ["admin", "department", "officer"] },
]

export function Header() {
  const {
    lang,
    setLang,
    currentPage,
    navigate,
    setChatOpen,
    isAdminLoggedIn,
    setIsAdminLoggedIn,
    adminEmail,
    setAdminEmail,
    staffRole,
    setAuthSession,
  } = useApp()
  const tr = t[lang]
  const isTamil = lang === "ta"
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accessibilityOpen, setAccessibilityOpen] = useState(false)

  // Keep document title synced to CivicAI
  useEffect(() => {
    document.title = "CivicAI — Smart Municipal Redressal & Governance Platform"
  }, [currentPage, lang])

  // Login Modal State
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [inputEmail, setInputEmail] = useState("civic123@gmail.com")
  const [inputPassword, setInputPassword] = useState("12345")
  const [loginError, setLoginError] = useState("")

  const handleNav = (page: Page) => {
    navigate(page)
    setMobileMenuOpen(false)
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    const emailTrimmed = inputEmail.trim().toLowerCase()
    const passwordTrimmed = inputPassword.trim()

    try {
      const res = await opsApi.login(emailTrimmed, passwordTrimmed)
      const user = res.data?.user
      const token = res.data?.token
      if (!token || !user) {
        throw new Error("Login did not return an authorization token.")
      }
      const role = (user.role || "admin") as StaffRole
      setAuthSession({ token, role, email: user.email })
      setIsAdminLoggedIn(true)
      setLoginModalOpen(false)
      if (role === "contractor") navigate("work-orders")
      else if (role === "department") navigate("department")
      else if (role === "officer") navigate("officer")
      else navigate("maintenance")
    } catch (err: any) {
      const msg = err?.message || ""
      const isConnectionErr = msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")
      setLoginError(
        isTamil
          ? "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல் (பயன்படுத்தவும்: civic123@gmail.com / 12345)"
          : isConnectionErr
          ? "Backend service unreachable. Please ensure the backend is running, or verify credentials (civic123@gmail.com / 12345)."
          : msg || "Invalid email or password (Use: civic123@gmail.com / 12345)",
      )
    }
  }

  const handleLogout = () => {
    setIsAdminLoggedIn(false)
    setAdminEmail(null)
    navigate("home")
  }

  const roleForNav: StaffRole = staffRole || (isAdminLoggedIn ? "admin" : null)
  const extraNav = ADMIN_EXTRA_NAV_ITEMS.filter((item) => roleForNav && item.roles.includes(roleForNav))
  const activeNavItems = isAdminLoggedIn ? [...CITIZEN_NAV_ITEMS, ...extraNav] : CITIZEN_NAV_ITEMS

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#d0d5e2] civic-shadow-sm">
      <a href="#main-content" className="skip-link">
        {tr.skipToContent}
      </a>

      {/* Government Circular Moving Marquee Loop Ticker */}
      <GovernmentCircularTicker />

      {/* Utility bar */}
      <div className="bg-[#1c3a6e] text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-8">
          <div
            className="flex items-center gap-1.5 font-medium"
            aria-label="CivicAI Civic Portal"
          >
            <span className="text-[#cf6009] font-bold">CivicAI</span>
            <span className="hidden sm:inline text-white/60 mx-1">·</span>
            <span className="hidden sm:inline text-white/80">
              {isTamil ? "AI குடிமை மேலாண்மை & அரசு சேவை தளம்" : "AI-Powered Civic Redressal & Governance Platform"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Admin / Staff Login & Status */}
            {isAdminLoggedIn ? (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-amber-300 font-bold flex items-center gap-1">
                  <span>🛡️</span>
                  <span className="hidden sm:inline">{adminEmail || "Admin"}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white/80 hover:text-white border border-white/20"
                >
                  {isTamil ? "வெளியேறு" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-lg border border-white/20 font-semibold"
              >
                <span>🔒</span>
                <span>{isTamil ? "நிர்வாக உள்நுழைவு" : "Staff / Admin Login"}</span>
              </button>
            )}

            {/* Language switcher */}
            <div
              className="inline-flex items-center bg-black/20 rounded border border-white/10 overflow-hidden text-xs"
              role="group"
              aria-label={tr.utility.switchLanguage}
            >
              <button
                onClick={() => setLang("ta")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "ta"
                    ? "bg-[#cf6009] text-white font-bold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                aria-pressed={lang === "ta"}
              >
                தமிழ்
              </button>
              <span className="text-white/30 select-none">|</span>
              <button
                onClick={() => setLang("en")}
                className={`px-2 py-0.5 transition-colors ${
                  lang === "en"
                    ? "bg-[#cf6009] text-white font-bold"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                aria-pressed={lang === "en"}
              >
                English
              </button>
            </div>

            <button
              onClick={() => setAccessibilityOpen(!accessibilityOpen)}
              className="hover:text-[#cf6009] transition-colors flex items-center gap-1"
              aria-expanded={accessibilityOpen}
              aria-label={tr.utility.accessibility}
            >
              <span aria-hidden="true">⚙</span>
              <span className="hidden sm:inline">
                {tr.utility.accessibility}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Accessibility toolbar */}
      {accessibilityOpen && (
        <AccessibilityToolbar onClose={() => setAccessibilityOpen(false)} />
      )}

      {/* Main header bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNav("home")}
            className="flex items-center gap-3 group text-left"
            aria-label="CivicAI Home"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1c3a6e] flex items-center justify-center text-white font-black text-xl shadow-xs group-hover:bg-[#102244] transition-colors">
              🏛️
            </div>
            <div>
              <div className="font-extrabold text-base text-[#0c1a30] leading-none tracking-tight">
                Civic<span className="text-[#cf6009]">AI</span>
              </div>
              <p className="text-[10px] text-[#64748b] leading-none mt-1 font-semibold">
                {isTamil ? "குடிமக்கள் மேலாண்மை தளம்" : "Open Civic Redressal Portal"}
              </p>
            </div>
          </button>


          {/* Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-1"
            aria-label="Main Navigation"
          >
            {activeNavItems.map(({ key, labelEn, labelTa }) => {
              const isActive = currentPage === key
              return (
                <button
                  key={key}
                  onClick={() => handleNav(key)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors ${
                    isActive
                      ? "text-[#1c3a6e] bg-[#e8eef8] font-black shadow-2xs"
                      : "text-[#334155] hover:text-[#1c3a6e] hover:bg-[#f4f6fa]"
                  } ${lang === "ta" ? "font-tamil" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isTamil ? labelTa : labelEn}
                </button>
              )
            })}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => setChatOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#0a6e5f] hover:bg-[#e0f4f1] rounded-xl transition-colors ${
                lang === "ta" ? "font-tamil" : ""
              }`}
              aria-label={tr.nav.aiAssistant}
            >
              <span aria-hidden="true">✦</span>
              {tr.nav.aiAssistant}
            </button>
            <button
              onClick={() => handleNav("citizen-dashboard")}
              className={`px-3 py-2 text-xs font-bold text-[#334155] hover:bg-[#f4f6fa] rounded-xl transition-colors border border-[#d0d5e2] ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {isTamil ? "குடிமகன் பலகை" : "Citizen Dashboard"}
            </button>
            <button
              onClick={() => handleNav("report")}
              className={`btn-primary text-xs font-black flex items-center gap-1.5 px-4 py-2 rounded-xl shadow-xs ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              <span aria-hidden="true">+</span>
              {tr.nav.report}
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => handleNav("report")}
              className={`btn-primary text-xs font-semibold px-3 py-1.5 rounded-lg ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              + {tr.nav.report}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#334155] hover:bg-[#f4f6fa] rounded-lg"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#d0d5e2] bg-white px-4 py-3 space-y-1">
          {activeNavItems.map(({ key, labelEn, labelTa }) => {
            const isActive = currentPage === key
            return (
              <button
                key={key}
                onClick={() => handleNav(key)}
                className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                  isActive
                    ? "text-[#1c3a6e] bg-[#e8eef8] font-bold"
                    : "text-[#334155] hover:bg-[#f4f6fa]"
                } ${lang === "ta" ? "font-tamil" : ""}`}
              >
                {isTamil ? labelTa : labelEn}
              </button>
            )
          })}
        </div>
      )}

      {/* Admin Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <h2 className="text-base font-extrabold text-gray-900">
                  {isTamil ? "நிர்வாகி & ஊழியர் உள்நுழைவு" : "Staff & Admin Portal Login"}
                </h2>
              </div>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              {isTamil
                ? "நிர்வாக கட்டுப்பாட்டு பலகை மற்றும் துறை பணிகளுக்கு உள்நுழையவும்."
                : "Authorized municipal officers and administrators only."}
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address / Login ID
                </label>
                <input
                  type="text"
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  placeholder="civic123@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="•••••"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                />
              </div>

              {loginError && (
                <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-[#1c3a6e]">
                <strong>Quick Credentials:</strong>
                <div>Admin: <code className="font-bold">civic123@gmail.com</code> / <code className="font-bold">12345</code></div>
                <div>Contractor: <code className="font-bold">roads.crew@civic.gov</code> / <code className="font-bold">pass123</code></div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  {isTamil ? "ரத்து" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1c3a6e] hover:bg-[#102244] rounded-xl shadow-xs"
                >
                  {isTamil ? "உள்நுழைக" : "Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  )
}
