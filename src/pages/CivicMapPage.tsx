import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext.tsx"
import { t } from "../i18n/translations.ts"
import { CivicMap } from "../components/CivicMap.tsx"
import { ComplaintCard } from "../components/ComplaintCard.tsx"
import { civicIssueService } from "../services/civicIssueService.ts"
import type { CivicIssue, Category } from "../types/index.ts"

export function CivicMapPage() {
  const { lang, navigate } = useApp()
  const tr = t[lang]
  const isTamil = lang === "ta"

  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCat, setSelectedCat] = useState<string>("all")

  useEffect(() => {
    async function loadIssues() {
      setLoading(true)
      const data = await civicIssueService.getIssues({
        category: selectedCat,
        search: searchQuery,
        limit: 100,
      })
      setIssues(data)
      setLoading(false)
    }
    loadIssues()
  }, [selectedCat, searchQuery])

  return (
    <main id="main-content" className="animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-[#1c3a6e] rounded-full text-xs font-bold mb-2 border border-blue-200">
              <span>🗺️</span>
              {isTamil
                ? "தமிழ்நாடு & இந்தியா முழுவதும் நேரடி வரைபடம்"
                : "Pan-India & Tamil Nadu Live Civic Map"}
            </div>
            <h1
              className={`text-2xl font-bold text-[#0c1a30] mb-1 ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {tr.map.heading}
            </h1>
            <p
              className={`text-sm text-[#64748b] ${
                isTamil ? "font-tamil" : ""
              }`}
            >
              {tr.map.subheading}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div
            className="flex border border-[#d0d5e2] rounded-xl overflow-hidden self-start bg-white shadow-xs"
            role="group"
            aria-label="View mode"
          >
            {(["map", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-xs font-bold transition-colors ${
                  viewMode === mode
                    ? "bg-[#1c3a6e] text-white"
                    : "text-[#64748b] hover:bg-[#f4f6fa]"
                } ${isTamil ? "font-tamil" : ""}`}
                aria-pressed={viewMode === mode}
              >
                {mode === "map"
                  ? "🗺️ " + tr.map.mapView
                  : "📋 " + tr.map.listView}
              </button>
            ))}
          </div>
        </div>

        {/* Map View */}
        {viewMode === "map" ? (
          <div className="w-full shadow-sm">
            <CivicMap
              height="650px"
              enableHeatmapToggle={true}
              enableFilters={true}
              enableSearch={true}
              enableRadiusControl={true}
            />
          </div>
        ) : (
          /* List View */
          <div className="space-y-5">
            {/* Search & Filter Bar */}
            <div className="p-4 bg-white rounded-2xl border border-[#d0d5e2] shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[240px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isTamil
                      ? "தலைப்பு, துறை, குறிச்சொல் அல்லது இருப்பிடம் தேடுக..."
                      : "Search by title, department, tags, or location..."
                  }
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                />
                <span className="absolute left-3 top-2.5 text-xs text-gray-400">
                  🔍
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-[#f8fafc] border border-gray-300 rounded-xl text-gray-800 focus:outline-none"
                >
                  <option value="all">{isTamil ? "அனைத்து வகைகள்" : "All Categories"}</option>
                  <option value="road">🛣️ {isTamil ? "சாலை" : "Roads"}</option>
                  <option value="garbage">🗑️ {isTamil ? "குப்பை" : "Garbage"}</option>
                  <option value="streetlight">💡 {isTamil ? "தெரு விளக்கு" : "Street Light"}</option>
                  <option value="water">💧 {isTamil ? "குடிநீர்" : "Water"}</option>
                  <option value="drainage">🚰 {isTamil ? "வடிகால்" : "Drainage"}</option>
                  <option value="traffic">🚦 {isTamil ? "போக்குவரத்து" : "Traffic"}</option>
                  <option value="parks">🌳 {isTamil ? "பூங்காக்கள்" : "Parks"}</option>
                  <option value="buildings">🏢 {isTamil ? "கட்டிடங்கள்" : "Buildings"}</option>
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {isTamil
                ? `பதிவு செய்யப்பட்ட புகார்கள்: ${issues.length}`
                : `Total Reported Issues: ${issues.length}`}
            </div>

            {issues.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-500 text-xs">
                {isTamil
                  ? "பொருந்தக்கூடிய புகார்கள் எதுவும் காணப்படவில்லை."
                  : "No complaints match your search criteria."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map((issue) => (
                  <ComplaintCard
                    key={issue.id}
                    complaint={issue}
                    lang={lang}
                    onClick={() => navigate("complaint-detail", issue.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
