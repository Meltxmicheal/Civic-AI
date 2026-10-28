import { useState, useEffect, useMemo } from "react"
import { useApp } from "../contexts/AppContext"
import { DEPARTMENTS, OFFICERS } from "../data/civicData"
import { civicIssueService } from "../services/civicIssueService"
import { generateCivicReportPDF } from "../services/pdfReportService"
import { getBeforeImage } from "../utils/imageUtils"
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge"
import { CivicMap } from "../components/CivicMap"
import type { CivicIssue, DepartmentId, ComplaintStatus } from "../types"

export function DepartmentDashboardPage() {
  const { lang, navigate, activeDepartmentId, setActiveDepartmentId } = useApp()
  const isTamil = lang === "ta"

  const [view, setView] = useState<"table" | "cards" | "map">("table")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [loading, setLoading] = useState(true)

  // Current active department object
  const currentDept = useMemo(() => {
    return DEPARTMENTS.find((d) => d.id === activeDepartmentId) || DEPARTMENTS[0]
  }, [activeDepartmentId])

  // Current department officers
  const deptOfficers = useMemo(() => {
    return OFFICERS.filter((o) => o.departmentId === currentDept.id)
  }, [currentDept])

  const fetchDepartmentIssues = async () => {
    setLoading(true)
    const all = await civicIssueService.getIssues({ limit: 500 })
    setIssues(all)
    setLoading(false)
  }

  useEffect(() => {
    fetchDepartmentIssues()
  }, [])

  // Auto-routed issues belonging to this department
  const deptIssues = useMemo(() => {
    return issues.filter((issue) => {
      const isMatch =
        issue.departmentId === currentDept.id ||
        issue.department.toLowerCase().includes(currentDept.shortName.toLowerCase()) ||
        issue.department.toLowerCase().includes(currentDept.name.toLowerCase())

      if (!isMatch) return false
      if (statusFilter !== "all" && issue.status !== statusFilter) return false
      return true
    })
  }, [issues, currentDept, statusFilter])

  // Live Metrics
  const deptStats = useMemo(() => {
    const total = deptIssues.length
    const open = deptIssues.filter((i) => i.status === "submitted").length
    const inProgress = deptIssues.filter((i) => i.status === "in_progress" || i.status === "assigned").length
    const resolved = deptIssues.filter((i) => i.status === "resolved").length
    const slaBreached = deptIssues.filter((i) => i.slaBreached).length
    return { total, open, inProgress, resolved, slaBreached }
  }, [deptIssues])

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      {/* Department Header with Brand Color */}
      <div
        className="text-white px-4 py-6 shadow-md transition-colors"
        style={{ background: currentDept.color }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl shadow-inner">
              {currentDept.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded-md">
                  {currentDept.shortName} Operations Portal
                </span>
                <span className="text-[11px] font-bold text-amber-300 bg-black/30 px-2 py-0.5 rounded-md">
                  ⭐ {currentDept.points.toLocaleString()} Points
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-0.5">
                {isTamil ? currentDept.nameTa : currentDept.name}
              </h1>
              <p className="text-xs text-white/80 mt-0.5 font-medium">
                Head: {currentDept.headOfficer} · {deptOfficers.length} Deployed Officers
              </p>
            </div>
          </div>

          {/* Quick Department Switcher */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-white/90">Switch Dept:</label>
            <select
              value={currentDept.id}
              onChange={(e) => setActiveDepartmentId(e.target.value as DepartmentId)}
              className="px-3 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-sm focus:outline-none cursor-pointer"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {isTamil ? d.nameTa : d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Quick Credentials & Live SLA Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Dummy Login Information */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Authorized Dummy Login</span>
              <div className="font-mono font-bold text-[#1c3a6e] mt-0.5">{currentDept.dummyId}</div>
              <div className="text-[11px] text-gray-500">Password: <strong className="text-gray-700">{currentDept.dummyPassword}</strong></div>
            </div>
            <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm">
              🔑
            </div>
          </div>

          {/* SLA Compliance */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">SLA Compliance Rate</span>
              <strong className="text-emerald-600 font-extrabold">{currentDept.slaCompliancePct}%</strong>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${currentDept.slaCompliancePct}%` }}
              />
            </div>
            <div className="text-[11px] text-gray-500">Avg Resolution: <strong>{currentDept.avgResolutionHours} hours</strong></div>
          </div>

          {/* Performance Badge */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Department Reward Badge</span>
              <div className="font-extrabold text-[#cf6009] text-sm mt-0.5">⭐ {currentDept.rewardsBadge}</div>
              <div className="text-[11px] text-gray-500">Rank: <strong>#{currentDept.rank} in Municipal Platform</strong></div>
            </div>
            <div className="text-2xl">🎖️</div>
          </div>
        </div>

        {/* Filter Controls & Views */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-1.5">
            {["all", "submitted", "assigned", "in_progress", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all capitalize ${
                  statusFilter === st
                    ? "bg-[#1c3a6e] text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {st === "all" ? "All Queue" : st.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* View Mode Buttons */}
          <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-1.5 font-bold transition-colors ${
                view === "table" ? "bg-[#1c3a6e] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              📋 Table
            </button>
            <button
              onClick={() => setView("cards")}
              className={`px-3 py-1.5 font-bold transition-colors border-x border-gray-200 ${
                view === "cards" ? "bg-[#1c3a6e] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🗂️ Cards
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 font-bold transition-colors ${
                view === "map" ? "bg-[#1c3a6e] text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              🗺️ GIS Map
            </button>
          </div>
        </div>

        {/* Department Reports Content */}
        {view === "table" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Complaint ID</th>
                    <th className="px-4 py-3">Before Photo</th>
                    <th className="px-4 py-3">Issue Title</th>
                    <th className="px-4 py-3">Location Address</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Assigned Officer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deptIssues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                        No grievances in this department queue matching the filter.
                      </td>
                    </tr>
                  ) : (
                    deptIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[#1c3a6e]">
                          {issue.id}
                        </td>
                        <td className="px-4 py-3">
                          <img
                            src={getBeforeImage(issue)}
                            alt="Incident"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-xs"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 max-w-[200px] truncate">
                          {isTamil && issue.titleTa ? issue.titleTa : issue.title}
                        </td>
                        <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">
                          📍 {issue.address}
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={issue.priority} lang={lang} size="sm" />
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {issue.officer ? (
                            <div className="space-y-1">
                              <span className="font-semibold text-emerald-700 block">
                                👤 {issue.officer}
                              </span>
                              {(() => {
                                const off = deptOfficers.find((o) => o.name === issue.officer) || deptOfficers[0] || OFFICERS[0]
                                const phone = off?.phone || "8940707924"
                                const msg = `🚨 *CivicAI Department Dispatch*\n\n*Complaint ID:* ${issue.id}\n*Title:* ${issue.title}\n*Location:* ${issue.address}\n\n*Action:* Inspect site, capture Before pic, repair issue, and submit After photo.`
                                const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`

                                const smsUrl = `sms:+91${phone}?body=${encodeURIComponent(msg)}`

                                return (
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <a
                                      href={waUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold"
                                      title="WhatsApp Dispatch"
                                    >
                                      💬 WA
                                    </a>
                                    <a
                                      href={smsUrl}
                                      className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold"
                                      title="SMS Dispatch"
                                    >
                                      📱 SMS
                                    </a>
                                    <span className="text-gray-400 font-mono text-[9px]">{phone}</span>
                                  </div>
                                )
                              })()}
                            </div>
                          ) : (
                            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px]">
                              — Pending Assign —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={issue.status} lang={lang} size="sm" />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => generateCivicReportPDF(issue, lang)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-bold"
                              title="Download PDF"
                            >
                              📥 PDF
                            </button>
                            <button
                              onClick={() => navigate("complaint-detail", issue.id)}
                              className="px-2.5 py-1.5 bg-[#1c3a6e] hover:bg-[#102244] text-white font-bold rounded-lg text-[11px]"
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
            {deptIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-[#1c3a6e] bg-blue-50 px-2 py-0.5 rounded-md">
                      {issue.id}
                    </span>
                    <StatusBadge status={issue.status} lang={lang} size="sm" />
                  </div>

                  {issue.imageUrl && (
                    <img
                      src={issue.imageUrl}
                      alt="Before pic"
                      className="w-full h-36 object-cover rounded-xl mt-3 border border-gray-200"
                    />
                  )}

                  <h3 className="font-extrabold text-sm text-gray-900 mt-3 line-clamp-1">
                    {isTamil && issue.titleTa ? issue.titleTa : issue.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {issue.description}
                  </p>
                  <div className="text-[11px] text-gray-500 mt-2 font-medium">
                    📍 {issue.address}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">
                    Officer: <strong>{issue.officer || "Unassigned"}</strong>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => generateCivicReportPDF(issue, lang)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl"
                      title="Download PDF"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => navigate("complaint-detail", issue.id)}
                      className="px-3 py-1.5 bg-[#1c3a6e] text-white font-bold rounded-xl"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "map" && (
          <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm space-y-3 animate-fade-in">
            <div className="rounded-2xl overflow-hidden border border-gray-300">
              <CivicMap
                height="500px"
                enableHeatmapToggle={true}
                enableFilters={true}
                enableSearch={true}
                enableRadiusControl={true}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
