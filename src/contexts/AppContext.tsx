import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import type {
  AppContextType,
  Language,
  Page,
  AccessibilitySettings,
  DepartmentId,
  StaffRole,
} from "../types"

const AppContext = createContext<AppContextType | null>(null)

const defaultAccessibility: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  xlargeText: false,
  reduceMotion: false,
  lineSpacing: false,
  highlightLinks: false,
}

const STORAGE_KEY = "civicai_lang"

function getInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "en" || saved === "ta") {
      return saved
    }
  } catch {
    // Ignore localStorage errors (e.g. sandboxed iframe or private browsing)
  }
  return "en"
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage)
  const [currentPage, setCurrentPage] = useState<Page>("home")
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(
    null,
  )
  const [accessibility, setAccessibility] =
    useState<AccessibilitySettings>(defaultAccessibility)
  const [chatOpen, setChatOpen] = useState(false)

  const setLang = (nextLang: Language) => {
    setLangState(nextLang)
    try {
      localStorage.setItem(STORAGE_KEY, nextLang)
    } catch {
      // Ignore localStorage errors
    }
  }

  useEffect(() => {
    document.documentElement.lang = lang
    const body = document.body
    body.classList.toggle("ta-active", lang === "ta")
  }, [lang])

  useEffect(() => {
    const body = document.body
    body.classList.toggle("high-contrast", accessibility.highContrast)
    body.classList.toggle(
      "large-text",
      accessibility.largeText && !accessibility.xlargeText,
    )
    body.classList.toggle("xlarge-text", accessibility.xlargeText)
    body.classList.toggle("reduce-motion", accessibility.reduceMotion)
    body.classList.toggle("line-spacing", accessibility.lineSpacing)
    body.classList.toggle("highlight-links", accessibility.highlightLinks)
  }, [accessibility])

  const navigate = (page: Page, complaintId?: string) => {
    setCurrentPage(page)
    if (complaintId) setSelectedComplaintId(complaintId)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
    accuracy: number
  } | null>(null)

  const [geminiApiKey, setGeminiApiKeyState] = useState<string>(() => {
    try {
      return (
        localStorage.getItem("civicai_gemini_api_key") ||
        (import.meta.env.VITE_GEMINI_API_KEY as string) ||
        ""
      )
    } catch {
      return ""
    }
  })

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key)
    try {
      localStorage.setItem("civicai_gemini_api_key", key)
    } catch {
      // ignore
    }
  }

  const [activeDepartmentId, setActiveDepartmentId] =
    useState<DepartmentId>("public-works")

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem("civicai_admin_logged_in") === "true"
    } catch {
      return false
    }
  })

  const [adminEmail, setAdminEmailState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("civicai_admin_email") || null
    } catch {
      return null
    }
  })

  const setAdminEmail = (email: string | null) => {
    setAdminEmailState(email)
    try {
      if (email) localStorage.setItem("civicai_admin_email", email)
      else localStorage.removeItem("civicai_admin_email")
    } catch {}
  }

  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem("civicai_auth_token")
    } catch {
      return null
    }
  })

  const [staffRole, setStaffRole] = useState<StaffRole>(() => {
    try {
      return (localStorage.getItem("civicai_staff_role") as StaffRole) || null
    } catch {
      return null
    }
  })

  const handleSetIsAdminLoggedIn = (val: boolean) => {
    setIsAdminLoggedIn(val)
    try {
      if (val) localStorage.setItem("civicai_admin_logged_in", "true")
      else {
        localStorage.removeItem("civicai_admin_logged_in")
        localStorage.removeItem("civicai_admin_email")
        localStorage.removeItem("civicai_auth_token")
        localStorage.removeItem("civicai_staff_role")
        setAuthToken(null)
        setStaffRole(null)
      }
    } catch {}
  }

  const setAuthSession = (session: {
    token: string | null
    role: StaffRole
    email: string | null
  }) => {
    setAuthToken(session.token)
    setStaffRole(session.role)
    setAdminEmail(session.email)
    try {
      if (session.token) localStorage.setItem("civicai_auth_token", session.token)
      else localStorage.removeItem("civicai_auth_token")
      if (session.role) localStorage.setItem("civicai_staff_role", session.role)
      else localStorage.removeItem("civicai_staff_role")
    } catch {}
  }

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        currentPage,
        navigate,
        selectedComplaintId,
        accessibility,
        setAccessibility,
        chatOpen,
        setChatOpen,
        userLocation,
        setUserLocation,
        geminiApiKey,
        setGeminiApiKey,
        activeDepartmentId,
        setActiveDepartmentId,
        isAdminLoggedIn,
        setIsAdminLoggedIn: handleSetIsAdminLoggedIn,
        adminEmail,
        setAdminEmail,
        authToken,
        staffRole,
        setAuthSession,
      }}
    >
      {children}
    </AppContext.Provider>
  )

}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}


