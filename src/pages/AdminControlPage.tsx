import { useState, useEffect, useMemo } from "react"
import { useApp } from "../contexts/AppContext"
import { DEPARTMENTS, OFFICERS, TREND_DATA, CATEGORY_DATA } from "../data/civicData"
import { civicIssueService } from "../services/civicIssueService"
import { generateCivicReportPDF } from "../services/pdfReportService"
import { CivicMap } from "../components/CivicMap"
import { StatusBadge, PriorityBadge, SLABadge } from "../components/StatusBadge"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { CivicIssue, DepartmentId, ComplaintStatus } from "../types"

export function AdminControlPage() {
  const { lang, navigate, setActiveDepartmentId } = useApp()
  const isTamil = lang === "ta"

  const [activeTab, setActiveTab] = useState<"analytics" | "reports" | "departments" | "map">(
    "analytics",
  )
  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Assign Officer Modal
  const [assignModalIssue, setAssignModalIssue] = useState<CivicIssue | null>(null)
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(OFFICERS[0].id)

  const fetchIssues = async () => {
    setLoading(true)
    const data = await civicIssueService.getIssues({ limit: 500 })
    setIssues(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchIssues()
  }, [])

  // Aggregate Stats
  const stats = useMemo(() => {
    const total = issues.length
    const resolved = issues.filter((i) => i.status === "resolved").length
    const inProgress = issues.filter((i) => i.status === "in_progress" || i.status === "assigned").length
    const open = issues.filter((i) => i.status === "submitted").length
    const slaBreached = issues.filter((i) => i.slaBreached).length
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 85

    return { total, resolved, inProgress, open, slaBreached, resolutionRate }
  }, [issues])

  // Filtered Issues for Reports Dashboard
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (selectedDeptFilter !== "all") {
        if (issue.departmentId) {
          if (issue.departmentId !== selectedDeptFilter) return false
        } else {
          // fallback string match
          const dept = DEPARTMENTS.find((d) => d.id === selectedDeptFilter)
          if (dept && !issue.department.toLowerCase().includes(dept.name.toLowerCase())) {
            return false
          }
        }
      }

      if (selectedStatusFilter !== "all" && issue.status !== selectedStatusFilter) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matches =
          issue.title.toLowerCase().includes(q) ||
          issue.id.toLowerCase().includes(q) ||
          issue.address.toLowerCase().includes(q) ||
          issue.department.toLowerCase().includes(q)
        if (!matches) return false
      }

      return true
    })
  }, [issues, selectedDeptFilter, selectedStatusFilter, searchQuery])

  // Department Leaderboard (Calculate live points)
  const departmentLeaderboard = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptIssues = issues.filter(
        (i) => i.departmentId === dept.id || i.department.toLowerCase().includes(dept.name.toLowerCase()),
      )
      const deptResolved = deptIssues.filter((i) => i.status === "resolved").length
      const deptOpen = deptIssues.filter((i) => i.status === "submitted").length
      const deptInProg = deptIssues.filter((i) => i.status === "in_progress" || i.status === "assigned").length
      const deptBreached = deptIssues.filter((i) => i.slaBreached).length
      const upvotes = deptIssues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0)

      // Points formula: (resolved * 100) + (upvotes * 10) - (breached * 50) + base points
      const livePoints = Math.max(100, dept.points + deptResolved * 100 + upvotes * 5 - deptBreached * 50)

      return {
        ...dept,
        total: Math.max(dept.total, deptIssues.length),
        resolved: Math.max(dept.resolved, deptResolved),
        open: deptOpen || dept.open,
        inProgress: deptInProg || dept.inProgress,
        slaBreached: deptBreached || dept.slaBreached,
        points: livePoints,
      }
    }).sort((a, b) => b.points - a.points)
  }, [issues])

  // Handle Assign Officer
  const handleAssignOfficer = async () => {
    if (!assignModalIssue) return
    const officer = OFFICERS.find((o) => o.id === selectedOfficerId)
    if (!officer) return

    await civicIssueService.assignOfficer(assignModalIssue.id, officer.id, officer.name)
    setAssignModalIssue(null)
    fetchIssues()
  }

  // Handle Status Update
  const handleQuickStatusChange = async (issueId: string, newStatus: ComplaintStatus) => {
    await civicIssueService.updateStatus(issueId, newStatus)
    fetchIssues()
  }

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      {/* Control Center Header */}
      <div className="bg-[#0c1a30] text-white px-4 py-6 border-b border-blue-900/50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-blue-200 font-bold uppercase tracking-widest">
                {isTamil ? "மத்திய நிர்வாக கட்டுப்பாட்டு மையம்" : "Central Governance Control Hub"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isTamil ? "CivicAI நிர்வாக மேலாண்மை தளம்" : "CivicAI Municipal Administration Portal"}
            </h1>

          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/15">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "analytics"
                  ? "bg-[#cf6009] text-white shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>📊</span>
              <span>{isTamil ? "பகுப்பாய்வு" : "Analytics"}</span>
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "reports"
                  ? "bg-[#cf6009] text-white shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>📋</span>
              <span>{isTamil ? "நேரலை புகார்கள்" : "Live Reports"}</span>
              <span className="px-1.5 py-0.2 bg-black/30 rounded-full text-[10px]">
                {issues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("departments")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "departments"
                  ? "bg-[#cf6009] text-white shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🏢</span>
              <span>{isTamil ? "9 துறைகள்" : "9 Departments"}</span>
            </button>

            <button
              onClick={() => setActiveTab("map")}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === "map"
                  ? "bg-[#cf6009] text-white shadow-md"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>🗺️</span>
              <span>{isTamil ? "வரைபட பார்வை" : "Map View"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Top Live Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-gray-400">Total Grievances</div>
            <div className="text-2xl font-black text-[#1c3a6e] mt-1">{stats.total}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Live Database Feed</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-amber-600">Pending Review</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{stats.open}</div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Awaiting Officer</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-blue-600">In Progress</div>
            <div className="text-2xl font-black text-blue-600 mt-1">{stats.inProgress}</div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Field Action Active</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-emerald-600">Resolved</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{stats.resolved}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Proof Verified</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-purple-600">Resolution Rate</div>
            <div className="text-2xl font-black text-purple-600 mt-1">{stats.resolutionRate}%</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Target: 90%</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <div className="text-[10px] font-bold uppercase text-red-600">SLA Breached</div>
            <div className="text-2xl font-black text-red-600 mt-1">{stats.slaBreached}</div>
            <div className="text-[11px] text-red-600 font-semibold mt-0.5">Requires Escalation</div>
          </div>
        </div>

        {/* TAB 1: Advanced Analytics & Leaderboard */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fade-in">
            {/* Department Performance Leaderboard & Points/Rewards */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                      {isTamil ? "துறை செயல்திறன் தரவரிசை & புள்ளிகள் விருதுகள்" : "Department Performance & Rewards Leaderboard"}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Points calculated automatically from issues resolved, resolution speed, and citizen upvotes.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Updated Real-Time
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {departmentLeaderboard.map((dept, idx) => (
                  <div
                    key={dept.id}
                    className={`p-4 rounded-2xl border-2 transition-all relative overflow-hidden flex flex-col justify-between ${
                      idx === 0
                        ? "border-amber-400 bg-amber-50/40 shadow-sm"
                        : idx === 1
                          ? "border-gray-300 bg-gray-50/50"
                          : idx === 2
                            ? "border-amber-700/30 bg-amber-50/20"
                            : "border-gray-200 bg-white"
                    }`}
                  >
                    {idx < 3 && (
                      <div className="absolute top-2 right-2 text-lg">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{dept.icon}</span>
                        <div>
                          <h3 className="font-extrabold text-xs text-gray-900 leading-tight">
                            {isTamil ? dept.nameTa : dept.name}
                          </h3>
                          <span className="text-[10px] text-gray-500 font-medium">
                            {dept.headOfficer}
                          </span>
                        </div>
                      </div>

                      <div className="my-2 p-2 bg-white rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Reward Points:</span>
                        <strong className="text-base font-black text-[#1c3a6e]">
                          {dept.points.toLocaleString()} pts
                        </strong>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] mb-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                          <div className="text-[9px] text-gray-400 uppercase font-bold">Resolved</div>
                          <div className="font-bold text-emerald-600">{dept.resolved}</div>
                        </div>
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                          <div className="text-[9px] text-gray-400 uppercase font-bold">Active</div>
                          <div className="font-bold text-blue-600">{dept.inProgress + dept.open}</div>
                        </div>
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                          <div className="text-[9px] text-gray-400 uppercase font-bold">SLA Rate</div>
                          <div className="font-bold text-purple-600">{dept.slaCompliancePct}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-[#cf6009] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                        ⭐ {dept.rewardsBadge}
                      </span>
                      <button
                        onClick={() => {
                          setActiveDepartmentId(dept.id)
                          navigate("department")
                        }}
                        className="text-[11px] font-bold text-[#1c3a6e] hover:underline"
                      >
                        Portal →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resolution Trends & Category Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends Area Chart */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-sm text-gray-900">
                    {isTamil ? "தினசரி புகார் & தீர்வு போக்கு" : "Daily Inflow vs Resolution Trend"}
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">Last 11 Days</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREND_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="complaints"
                        stroke="#1c3a6e"
                        fill="#e8eef8"
                        name="Reported"
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        stroke="#10b981"
                        fill="#d1fae5"
                        name="Resolved"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Resolution Bar Chart */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="font-bold text-sm text-gray-900">
                    {isTamil ? "துறைவாரியாக தீர்க்கப்பட்ட புகார்கள்" : "Resolution Count by Department"}
                  </h3>
                  <span className="text-xs font-semibold text-gray-500">9 Departments</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentLeaderboard} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis dataKey="shortName" type="category" tick={{ fontSize: 10 }} width={75} />
                      <Tooltip />
                      <Bar dataKey="resolved" fill="#1c3a6e" radius={[0, 6, 6, 0]} name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Real-time Reports Feed */}
        {activeTab === "reports" && (
          <div className="space-y-4 animate-fade-in">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isTamil
                      ? "புகார் எண், தலைப்பு, இருப்பிடம் தேடுக..."
                      : "Search by ID, title, locality..."
                  }
                  className="w-full pl-8 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                />
                <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-600">Department:</span>
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-800 focus:outline-none"
                >
                  <option value="all">All 9 Departments</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.icon} {isTamil ? d.nameTa : d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-600">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold text-gray-800 focus:outline-none capitalize"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <button
                onClick={fetchIssues}
                className="px-3 py-2 bg-blue-50 text-[#1c3a6e] hover:bg-blue-100 font-bold rounded-xl border border-blue-200 flex items-center gap-1"
              >
                <span>🔄</span>
                <span>Refresh</span>
              </button>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Reference ID</th>
                      <th className="px-4 py-3">Photo</th>
                      <th className="px-4 py-3">Title & Issue</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Assigned Officer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredIssues.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No complaints match active filters.
                        </td>
                      </tr>
                    ) : (
                      filteredIssues.map((issue) => (
                        <tr key={issue.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-[#1c3a6e]">
                            {issue.id}
                          </td>
                          <td className="px-4 py-3">
                            {issue.imageUrl ? (
                              <img
                                src={issue.imageUrl}
                                alt="Issue"
                                className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <span className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                📷
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <div className="font-bold text-gray-900 truncate">
                              {isTamil && issue.titleTa ? issue.titleTa : issue.title}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate mt-0.5">
                              📍 {issue.address}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {isTamil && issue.departmentTa ? issue.departmentTa : issue.department}
                          </td>
                          <td className="px-4 py-3">
                            {issue.officer ? (
                              <div className="space-y-1">
                                <span className="font-semibold text-emerald-700 block">
                                  👤 {issue.officer}
                                </span>
                                {(() => {
                                  const off = OFFICERS.find(
                                    (o) =>
                                      o.id === issue.assignedOfficerId ||
                                      o.name === issue.officer ||
                                      o.departmentId === issue.departmentId,
                                  ) || OFFICERS[0]
                                  const phone = off.phone || "8940707924"
                                  const msg = `🚨 *CivicAI Grievance Dispatch*\n\n*Complaint ID:* ${issue.id}\n*Title:* ${issue.title}\n*Location:* ${issue.address} (${issue.district})\n*Priority:* ${issue.priority.toUpperCase()}\n\n*Instructions:* Please inspect the site, take Before Photo, perform rectification, and upload After Photo proof.`
                                  const waUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`

                                  const smsUrl = `sms:+91${phone}?body=${encodeURIComponent(msg)}`

                                  return (
                                    <div className="flex items-center gap-1 text-[10px]">
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold flex items-center gap-0.5"
                                        title={`Dispatch to ${phone} via WhatsApp`}
                                      >
                                        <span>💬</span> WA
                                      </a>
                                      <a
                                        href={smsUrl}
                                        className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold flex items-center gap-0.5"
                                        title={`SMS to ${phone}`}
                                      >
                                        <span>📱</span> SMS
                                      </a>
                                      <span className="text-gray-400 font-mono text-[9px]">{phone}</span>
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              <button
                                onClick={() => setAssignModalIssue(issue)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold"
                              >
                                + Assign Officer
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={issue.status} lang={lang} size="sm" />
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => generateCivicReportPDF(issue, lang)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                                title="Download PDF Report"
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
          </div>
        )}

        {/* TAB 3: 9 Department Hub & Dummy Logins */}
        {activeTab === "departments" && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-center justify-between">
              <div>
                <strong>🔑 Department Auto-Routing & Quick Login Hub</strong>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Click any department card to switch directly into that department's operations dashboard with dummy officer credentials.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs" style={{ background: dept.bgLight }}>
                        {dept.icon}
                      </div>
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-200">
                        {dept.totalOfficers} Officers
                      </span>
                    </div>

                    <div className="mt-3">
                      <h3 className="font-extrabold text-sm text-gray-900">
                        {isTamil ? dept.nameTa : dept.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        Head: {dept.headOfficer}
                      </p>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Login ID:</span>
                        <strong className="text-[#1c3a6e]">{dept.dummyId}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Password:</span>
                        <strong className="text-gray-700">{dept.dummyPassword}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700">
                      ⭐ {dept.points.toLocaleString()} pts
                    </span>
                    <button
                      onClick={() => {
                        setActiveDepartmentId(dept.id)
                        navigate("department")
                      }}
                      className="px-4 py-2 bg-[#1c3a6e] hover:bg-[#102244] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                    >
                      Login Portal →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: GIS Interactive Map View */}
        {activeTab === "map" && (
          <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <h3 className="font-extrabold text-sm text-gray-900">
                  {isTamil ? "அனைத்து துறை நேரலை வரைபடம்" : "Pan-Department Live GIS Map"}
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-semibold">
                Showing {issues.length} active database records
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-300 shadow-xs">
              <CivicMap
                height="560px"
                enableHeatmapToggle={true}
                enableFilters={true}
                enableSearch={true}
                enableRadiusControl={true}
                interactiveLocationSelect={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Assign Officer Modal */}
      {assignModalIssue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-200 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">👤</span>
                <h3 className="font-bold text-sm text-gray-900">Assign Field Officer</h3>
              </div>
              <button
                onClick={() => setAssignModalIssue(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="font-bold text-gray-900">{assignModalIssue.title}</div>
                <div className="text-gray-500 font-mono text-[11px] mt-0.5">
                  ID: {assignModalIssue.id} · {assignModalIssue.department}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Select Authorized Officer
                </label>
                <select
                  value={selectedOfficerId}
                  onChange={(e) => setSelectedOfficerId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                >
                  {OFFICERS.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.department}) — Rating: {off.rating}★
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setAssignModalIssue(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOfficer}
                className="px-5 py-2 text-xs font-bold text-white bg-[#1c3a6e] hover:bg-[#102244] rounded-xl shadow-xs"
              >
                Assign & Deploy Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
