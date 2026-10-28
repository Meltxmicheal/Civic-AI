import { useEffect, useState } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CivicMap } from "../components/CivicMap"
import { PersistenceNotice, money } from "../components/OpsChrome"
import { useApp } from "../contexts/AppContext"
import { opsApi } from "../services/opsApi"

export function CivicIntelligencePage() {
  const { lang } = useApp()
  const isTamil = lang === "ta"
  const [trends, setTrends] = useState<any>(null)
  const [areas, setAreas] = useState<any>(null)
  const [integrations, setIntegrations] = useState<any[]>([])
  const [feeds, setFeeds] = useState<any[]>([])
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [persistence, setPersistence] = useState<{ persistence?: string; persistedToDatabase?: boolean }>({})

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [t, a, i, f] = await Promise.all([
          opsApi.trends(),
          opsApi.areas(),
          opsApi.integrations(),
          opsApi.simulatedFeeds(),
        ])
        if (cancelled) return
        setTrends(t.data)
        setAreas(a.data)
        setIntegrations(i.data || [])
        setFeeds(f.data || [])
        setPersistence({ persistence: t.persistence, persistedToDatabase: t.persistedToDatabase })
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Unable to load civic intelligence.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function inspectIntegration(id: string) {
    try {
      const res = await opsApi.integrationStatus(id)
      setSelectedIntegration(res.data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const volume = trends?.complaintVolumeOverTime || []
  const deptTimes = (trends?.resolutionTimesByDepartment || []).map((row: any) => ({
    department: row.department,
    hours: row.averageResolutionHours,
  }))

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      <div className="bg-[#1c3a6e] text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">{isTamil ? "குடிமை பகுப்பாய்வு" : "Civic intelligence"}</p>
          <h1 className={`text-2xl font-black mt-1 ${isTamil ? "font-tamil" : ""}`}>{isTamil ? "குடிமை நுண்ணறிவு" : "Civic Intelligence"}</h1>
          <p className="text-sm text-white/80 mt-1 max-w-3xl">
            {isTamil
              ? "சேமிக்கப்பட்ட புகார்களிலிருந்து போக்குகள் மற்றும் பகுதி பகுப்பாய்வு. ஒருங்கிணைப்புகள் இணைக்கப்படாவிட்டால் அவ்வாறு குறிக்கப்படும்."
              : "Trends and area analytics from stored complaints. Integrations show real, simulated, or unavailable status — never a fake live connection."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        <PersistenceNotice persistence={persistence.persistence} persistedToDatabase={persistence.persistedToDatabase} />
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
        {loading && <p className="text-sm text-[#64748b]">{isTamil ? "ஏற்றுகிறது…" : "Loading civic intelligence…"}</p>}

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold mb-2">{isTamil ? "புகார் அளவு" : "Complaint volume over time"}</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="reported" stroke="#1c3a6e" fill="#e8eef8" />
                  <Area type="monotone" dataKey="unresolved" stroke="#cf6009" fill="#fde7d4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {(trends?.notes || []).map((note: string) => (
              <p key={note} className="text-[11px] text-[#64748b] mt-2">{note}</p>
            ))}
            {(trends?.insufficientData || []).map((note: string) => (
              <p key={note} className="text-[11px] text-amber-700">{note}</p>
            ))}
          </div>
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold mb-2">{isTamil ? "துறை தீர்வு நேரம்" : "Resolution time by department"}</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" hide />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#0a6e5f" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">Null averages mean resolvedAt was missing for that department.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#d0d5e2] rounded-2xl overflow-hidden min-h-[320px]">
            <CivicMap height="320px" enableHeatmapToggle enableFilters={false} />
          </div>
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 text-xs">
            <h2 className="font-bold text-sm mb-2">{isTamil ? "பகுதி அடர்த்தி" : "Complaint density by recorded ward/zone"}</h2>
            <p className="text-[#64748b] mb-2">{areas?.boundaryDisclaimer}</p>
            <div className="max-h-72 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="py-1">Area</th>
                    <th>Count</th>
                    <th>Open</th>
                    <th>Avg hrs</th>
                    <th>Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {(areas?.areas || []).map((area: any) => (
                    <tr key={area.label} className="border-t">
                      <td className="py-1">{area.label}</td>
                      <td>{area.complaintCount}</td>
                      <td>{area.unresolved}</td>
                      <td>{area.averageResolutionHours ?? "Unavailable"}</td>
                      <td>{money(area.maintenanceSpend)}{area.spendUnknownRecords ? ` +${area.spendUnknownRecords} unknown` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h3 className="font-bold mt-3">{isTamil ? "தீர்க்கப்படாத உயர் முன்னுரிமை" : "Unresolved high-priority"}</h3>
            <ul className="space-y-1 mt-1">
              {(areas?.unresolvedHighPriority || []).map((row: any) => (
                <li key={row.issue.id}>{row.issue.id} · {row.issue.title} · {row.score?.score ?? "Unavailable"}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
          <h2 className="font-bold mb-3">{isTamil ? "ஒருங்கிணைப்பு பதிவேடு" : "Integration registry"}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((item) => (
              <button key={item.id} onClick={() => inspectIntegration(item.id)} className="text-left border rounded-2xl p-3 text-xs hover:bg-[#f4f6fa]">
                <div className="font-bold">{item.name}</div>
                <div className="text-[#64748b]">{item.purpose}</div>
                <div className="mt-2">Status: {item.connectionStatus}</div>
                <div>Config: {item.configurationStatus}</div>
                <div>Data: {item.dataFidelity}</div>
                <div>Last sync: {item.lastSuccessfulSync ? new Date(item.lastSuccessfulSync).toLocaleString() : "Never"}</div>
              </button>
            ))}
          </div>
          {selectedIntegration && (
            <div className="mt-4 border rounded-2xl p-3 text-xs">
              <p className="font-bold">{selectedIntegration.name}</p>
              <p>{selectedIntegration.notes}</p>
              <p>Source: {selectedIntegration.dataSource}</p>
              {(selectedIntegration.recentReadings || []).map((row: any) => (
                <p key={row.id}>{row.id} · {row.kind} · {row.dataFidelity} · {row.recordedAt} · {JSON.stringify(row.payload)}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 text-xs">
          <h2 className="font-bold text-sm mb-2">{isTamil ? "உருவகப்படுத்தப்பட்ட ஊட்டங்கள்" : "Simulated weather and sensor readings"}</h2>
          <p className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2 mb-2">Every row below is simulated. Inspect source, kind, and timestamp before using it in a decision.</p>
          <ul className="space-y-1">
            {feeds.map((row) => (
              <li key={row.id}>
                <strong>{row.id}</strong> · {row.kind} · {row.locationLabel} · {row.dataFidelity} · {row.recordedAt} · {JSON.stringify(row.payload)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
