import { AppProvider, useApp } from "./contexts/AppContext"
import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { MobileBottomNav } from "./components/MobileBottomNav"
import { ChatBot } from "./components/ChatBot"
import { HomePage } from "./pages/HomePage"
import { ReportIssuePage } from "./pages/ReportIssuePage"
import { TrackComplaintPage } from "./pages/TrackComplaintPage"
import { ComplaintDetailPage } from "./pages/ComplaintDetailPage"
import { CivicMapPage } from "./pages/CivicMapPage"
import { TransparencyPage } from "./pages/TransparencyPage"
import { CitizenDashboardPage } from "./pages/CitizenDashboardPage"
import { AdminControlPage } from "./pages/AdminControlPage"
import { FieldOfficerPage } from "./pages/FieldOfficerPage"
import { DepartmentDashboardPage } from "./pages/DepartmentDashboardPage"
import { MaintenanceIntelligencePage } from "./pages/MaintenanceIntelligencePage"
import { WorkOrdersPage } from "./pages/WorkOrdersPage"
import { CivicIntelligencePage } from "./pages/CivicIntelligencePage"
import { t } from "./i18n/translations"

export function OfflineBanner() {
  const { lang } = useApp()
  const tr = t[lang].errors
  return (
    <div
      role="alert"
      className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-sm text-amber-700"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
      </svg>
      <span className={lang === "ta" ? "font-tamil" : ""}>{tr.offline}</span>
    </div>
  )
}

function AppContent() {
  const { currentPage } = useApp()

  const pageMap = {
    home: <HomePage />,
    report: <ReportIssuePage />,
    track: <TrackComplaintPage />,
    "complaint-detail": <ComplaintDetailPage />,
    map: <CivicMapPage />,
    transparency: <TransparencyPage />,
    "citizen-dashboard": <CitizenDashboardPage />,
    admin: <AdminControlPage />,
    officer: <FieldOfficerPage />,
    department: <DepartmentDashboardPage />,
    maintenance: <MaintenanceIntelligencePage />,
    "work-orders": <WorkOrdersPage />,
    "civic-intelligence": <CivicIntelligencePage />,
  }

  const isMobileOnly = currentPage === "officer"

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fa]">
      {!isMobileOnly && <Header />}
      <div className="flex-1 pb-20 lg:pb-0">
        {pageMap[currentPage] ?? <HomePage />}
      </div>
      {!isMobileOnly && <Footer />}
      <MobileBottomNav />
      <ChatBot />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
