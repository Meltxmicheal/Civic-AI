import { useState, useEffect, useMemo } from "react"
import { useApp } from "../contexts/AppContext"
import { DEPARTMENTS, TREND_DATA, CATEGORY_DATA } from "../data/civicData"
import { civicIssueService } from "../services/civicIssueService"
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
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { CivicIssue } from "../types"

export function TransparencyPage() {
  const { lang } = useApp()
  const isTamil = lang === "ta"

  const [issues, setIssues] = useState<CivicIssue[]>([])

  useEffect(() => {
    civicIssueService.getIssues({ limit: 500 }).then(setIssues)
  }, [])

  // Calculate live department stats and points
  const departmentLeaderboard = useMemo(() => {
    return DEPARTMENTS.map((dept) => {
      const deptIssues = issues.filter(
        (i) =>
          i.departmentId === dept.id ||
          i.department.toLowerCase().includes(dept.name.toLowerCase()) ||
          i.department.toLowerCase().includes(dept.shortName.toLowerCase()),
      )
      const deptResolved = deptIssues.filter((i) => i.status === "resolved").length
      const deptOccurred = Math.max(dept.total, deptIssues.length)
      const upvotes = deptIssues.reduce((acc, curr) => acc + (curr.upvotes || 0), 0)
      const livePoints = Math.max(100, dept.points + deptResolved * 100 + upvotes * 5)

      return {
        ...dept,
        total: deptOccurred,
        resolved: Math.max(dept.resolved, deptResolved),
        points: livePoints,
      }
    }).sort((a, b) => b.points - a.points)
  }, [issues])

  const totalOccurred = useMemo(() => {
    return departmentLeaderboard.reduce((acc, d) => acc + d.total, 0)
  }, [departmentLeaderboard])

  const totalResolved = useMemo(() => {
    return departmentLeaderboard.reduce((acc, d) => acc + d.resolved, 0)
  }, [departmentLeaderboard])

  const overallRate = totalOccurred > 0 ? Math.round((totalResolved / totalOccurred) * 100) : 88

  const tooltipStyle = {
    backgroundColor: "white",
    border: "1px solid #d0d5e2",
    borderRadius: "12px",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgba(12,26,48,0.08)",
  }

  return (
    <main id="main-content" className="animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="bg-[#1c3a6e] text-white px-4 py-8 border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-1">
            <span>🏆</span>
            <span>{isTamil ? "அனைத்து 9 துறைகள் வெளிப்படைத்தன்மை அறிக்கை" : "Public Department Performance & Leaderboard"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {isTamil ? "நகராட்சி துறைகள் செயல்திறன் தரவரிசை & புள்ளிவிவரங்கள்" : "Municipal Department Performance & Analytics"}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 max-w-2xl mx-auto">
            {isTamil
              ? "எந்தெந்த துறைகள் எத்தனை புகார்களைத் தீர்த்துள்ளன, சேவை நிலை ஒப்பந்த இணக்கம் மற்றும் குடிமக்கள் புள்ளிகள் மதிப்பீடு நேரலையாகக் காட்டப்படுகிறது."
              : "Real-time transparent analytics showing which departments resolved the most civic issues, response times, and citizen points ranking."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs text-center space-y-1">
            <div className="text-[10px] font-bold uppercase text-gray-400">Total Issues Occurred</div>
            <div className="text-2xl sm:text-3xl font-black text-[#1c3a6e]">{totalOccurred.toLocaleString()}</div>
            <div className="text-[11px] text-gray-500 font-semibold">Across All 9 Wings</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs text-center space-y-1">
            <div className="text-[10px] font-bold uppercase text-emerald-600">Successfully Solved</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{totalResolved.toLocaleString()}</div>
            <div className="text-[11px] text-emerald-700 font-semibold">With Verified Proof</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs text-center space-y-1">
            <div className="text-[10px] font-bold uppercase text-purple-600">Citywide Resolution Rate</div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600">{overallRate}%</div>
            <div className="text-[11px] text-purple-700 font-semibold">Target Standard: 85%</div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs text-center space-y-1">
            <div className="text-[10px] font-bold uppercase text-amber-600">Participating Departments</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">9 Active</div>
            <div className="text-[11px] text-amber-700 font-semibold">24x7 Municipal Network</div>
          </div>
        </div>

        {/* 9 Participating Departments Overview Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {isTamil ? "பங்கேற்கும் 9 துறைகள் & விருதுகள்" : "9 Participating Municipal Departments & Honors"}
              </h2>
              <p className="text-xs text-gray-500">
                Real-time points awarded for fast resolution, photographic proof, and high citizen upvotes.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Live Database Score
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentLeaderboard.map((dept, idx) => (
              <div
                key={dept.id}
                className="bg-white rounded-3xl p-5 border-2 border-gray-200 hover:border-[#1c3a6e] hover:shadow-md transition-all space-y-3 relative overflow-hidden flex flex-col justify-between"
              >
                {idx < 3 && (
                  <div className="absolute top-3 right-3 text-xl">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                      style={{ background: dept.bgLight }}
                    >
                      {dept.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-gray-900 leading-tight">
                        {isTamil ? dept.nameTa : dept.name}
                      </h3>
                      <span className="text-[10px] text-gray-500 font-semibold">
                        Rank #{idx + 1} · {dept.headOfficer}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3 pt-3 border-t border-gray-100">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-bold">Solved</div>
                      <div className="font-extrabold text-emerald-600">{dept.resolved}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-bold">Occurred</div>
                      <div className="font-extrabold text-[#1c3a6e]">{dept.total}</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                      <div className="text-[9px] text-gray-400 uppercase font-bold">SLA %</div>
                      <div className="font-extrabold text-purple-600">{dept.slaCompliancePct}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#cf6009] text-[11px] bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                    ⭐ {dept.rewardsBadge}
                  </span>
                  <strong className="font-black text-[#1c3a6e] font-mono text-sm">
                    {dept.points.toLocaleString()} pts
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section: Department Solved Comparison & Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Resolution Bar Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {isTamil ? "துறைவாரியாக தீர்க்கப்பட்ட புகார்கள் எண்ணிக்கை" : "Issues Solved vs Occurred by Department"}
              </h3>
              <p className="text-xs text-gray-500">
                Comparison of total reported issues and verified resolutions per department.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentLeaderboard} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="shortName" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="resolved" fill="#10b981" radius={[0, 4, 4, 0]} name="Solved" />
                  <Bar dataKey="total" fill="#1c3a6e" radius={[0, 4, 4, 0]} name="Occurred" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Inflow vs Resolution Trend Area Chart */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {isTamil ? "தினசரி புகார் வரவு vs தீர்வு போக்கு" : "Daily Grievances Inflow vs Resolution Trend"}
              </h3>
              <p className="text-xs text-gray-500">
                Historical 11-day resolution velocity across all municipal zones.
              </p>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TREND_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
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
        </div>

        {/* Category Breakdown & SLA Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution Pie */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {isTamil ? "வகைவாரியான குடிமைப் பிரச்சினைகள்" : "Civic Issues Breakdown by Category"}
              </h3>
              <p className="text-xs text-gray-500">
                Distribution of reported problems (Roads, Sanitation, Water, Lighting, Drainage).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-56 w-56 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_DATA}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      strokeWidth={2}
                      stroke="white"
                    >
                      {CATEGORY_DATA.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1 text-xs">
                {CATEGORY_DATA.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-xl">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
                    <span className="font-semibold text-gray-700 truncate">{d.name}</span>
                    <span className="ml-auto font-mono font-bold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SLA Compliance Rate Comparison */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                {isTamil ? "துறை SLA இணக்க வீதம் (%)" : "SLA Compliance Rate Comparison (%)"}
              </h3>
              <p className="text-xs text-gray-500">
                Percentage of complaints resolved strictly within guaranteed service timeline.
              </p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentLeaderboard}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="shortName" tick={{ fontSize: 9 }} />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="slaCompliancePct" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="SLA %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Public Leaderboard Summary Table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden space-y-3 p-6">
          <h3 className="font-black text-sm text-gray-900">
            {isTamil ? "அதிகாரப்பூர்வ துறை செயல்திறன் தரவரிசைப் பட்டியல்" : "Official Municipal Performance Standings Table"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Rank & Dept</th>
                  <th className="px-4 py-3">Head Officer</th>
                  <th className="px-4 py-3 text-center">Issues Occurred</th>
                  <th className="px-4 py-3 text-center">Solved</th>
                  <th className="px-4 py-3 text-center">SLA Compliance</th>
                  <th className="px-4 py-3 text-center">Reward Points</th>
                  <th className="px-4 py-3">Honor Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departmentLeaderboard.map((dept, idx) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-black">
                        #{idx + 1}
                      </span>
                      <span>{dept.icon}</span>
                      <span>{isTamil ? dept.nameTa : dept.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-medium">
                      {dept.headOfficer}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">
                      {dept.total}
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-emerald-600">
                      {dept.resolved}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {dept.slaCompliancePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-black text-[#1c3a6e]">
                      {dept.points.toLocaleString()} pts
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        ⭐ {dept.rewardsBadge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
