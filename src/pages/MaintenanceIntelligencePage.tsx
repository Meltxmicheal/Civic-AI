import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CivicMap } from "../components/CivicMap"
import { PersistenceNotice, money, scoreLabel } from "../components/OpsChrome"
import { useApp } from "../contexts/AppContext"
import { opsApi } from "../services/opsApi"

function queryString(filters: Record<string, string>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== "all") params.set(key, value)
  }
  const text = params.toString()
  return text ? `?${text}` : ""
}

export function MaintenanceIntelligencePage() {
  const { lang, staffRole, navigate } = useApp()
  const isTamil = lang === "ta"
  const canEdit = staffRole === "admin" || staffRole === "department"

  const [filters, setFilters] = useState({ department: "all", ward: "all", severity: "all", status: "all" })
  const [overview, setOverview] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [planDetail, setPlanDetail] = useState<any>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [compareA, setCompareA] = useState("")
  const [compareB, setCompareB] = useState("")
  const [comparison, setComparison] = useState<any>(null)
  const [weights, setWeights] = useState({ safetyRisk: 0.3, severity: 0.25, affectedPopulation: 0.2, recurrence: 0.15, roadImportance: 0.1 })
  const [budgetForm, setBudgetForm] = useState({ name: "Planning window", availableBudget: "450000", department: "all", ward: "all" })
  const [estimateForm, setEstimateForm] = useState({ costEstimate: "", safetyRiskScore: "", affectedPopulation: "", roadImportanceScore: "", source: "" })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [persistence, setPersistence] = useState<{ persistence?: string; persistedToDatabase?: boolean }>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = queryString(filters)
      const [ov, pri] = await Promise.all([opsApi.overview(qs), opsApi.priorities(qs)])
      setOverview(ov.data)
      setRows(pri.data || [])
      setPersistence({ persistence: ov.persistence, persistedToDatabase: ov.persistedToDatabase })
      if (ov.data?.weights) setWeights(ov.data.weights)
      const planId = ov.data?.activePlan?.id
      if (planId) {
        const plan = await opsApi.getBudgetPlan(planId)
        setPlanDetail(plan.data)
      }
    } catch (err: any) {
      setError(err.message || "Unable to load maintenance intelligence.")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const selected = useMemo(() => rows.find((r) => r.issue?.id === selectedId) || rows[0], [rows, selectedId])
  const recommendation = planDetail?.recommendation || overview?.recommendation
  const wards = useMemo(() => Array.from(new Set(rows.map((r) => r.issue?.ward).filter(Boolean))), [rows])
  const departments = useMemo(() => Array.from(new Set(rows.map((r) => r.issue?.department).filter(Boolean))), [rows])

  const chartData = useMemo(
    () => [
      { name: isTamil ? "கிடைக்கும்" : "Available", value: recommendation?.availableBudget || 0 },
      { name: isTamil ? "தகுதியான செலவு" : "Eligible cost", value: recommendation?.eligibleRepairCost || 0 },
      { name: isTamil ? "பரிந்துரை" : "Recommended", value: recommendation?.recommendedSpend || 0 },
      { name: isTamil ? "மீதம்" : "Remaining", value: recommendation?.remainingBudget || 0 },
    ],
    [recommendation, isTamil],
  )

  async function runCompare() {
    if (!compareA || !compareB) return
    try {
      const res = await opsApi.compare(compareA, compareB)
      setComparison(res.data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function saveWeights() {
    try {
      await opsApi.saveWeights(weights)
      setNotice(isTamil ? "எடைகள் சேமிக்கப்பட்டன." : "Priority weights saved.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function createPlan() {
    try {
      await opsApi.createBudgetPlan({
        ...budgetForm,
        availableBudget: Number(budgetForm.availableBudget),
      })
      setNotice(isTamil ? "பட்ஜெட் திட்டம் உருவாக்கப்பட்டது." : "Budget plan created.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function saveEstimates() {
    if (!selected?.issue?.id) return
    const patch: Record<string, unknown> = {}
    if (estimateForm.costEstimate !== "") patch.costEstimate = Number(estimateForm.costEstimate)
    if (estimateForm.safetyRiskScore !== "") patch.safetyRiskScore = Number(estimateForm.safetyRiskScore)
    if (estimateForm.affectedPopulation !== "") patch.affectedPopulation = Number(estimateForm.affectedPopulation)
    if (estimateForm.roadImportanceScore !== "") patch.roadImportanceScore = Number(estimateForm.roadImportanceScore)
    if (estimateForm.source) {
      patch.costEstimateSource = estimateForm.source
      patch.safetyRiskSource = estimateForm.source
      patch.affectedPopulationSource = estimateForm.source
      patch.roadImportanceSource = estimateForm.source
    }
    try {
      await opsApi.patchIssue(selected.issue.id, patch)
      setNotice(isTamil ? "மதிப்பீடுகள் புதுப்பிக்கப்பட்டன." : "Estimates updated with recorded source.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function createWorkOrder(complaintId: string) {
    try {
      await opsApi.createWorkOrder({ complaintId })
      setNotice(isTamil ? "பணி ஆணை உருவாக்கப்பட்டது." : "Work order created from this complaint.")
      navigate("work-orders")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      <div className="bg-[#1c3a6e] text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
            {isTamil ? "நகராட்சி செயல்பாடு" : "Municipal operations"}
          </p>
          <h1 className={`text-2xl font-black mt-1 ${isTamil ? "font-tamil" : ""}`}>
            {isTamil ? "பராமரிப்பு நுண்ணறிவு" : "Maintenance Intelligence"}
          </h1>
          <p className="text-sm text-white/80 mt-1 max-w-3xl">
            {isTamil
              ? "எந்த பழுதுபார்ப்புகளை முதலில் செய்ய வேண்டும் என்பதை முன்னுரிமை மதிப்பெண் மற்றும் பட்ஜெட் பரிந்துரைகளுடன் தீர்மானிக்கவும்."
              : "Decide which maintenance jobs to fund first using explainable priority scores and a constrained budget recommendation."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        <PersistenceNotice persistence={persistence.persistence} persistedToDatabase={persistence.persistedToDatabase} />
        <p className="text-xs text-[#64748b]">{overview?.weightDisclaimer}</p>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
        {notice && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">{notice}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isTamil ? "திறந்த புகார்கள்" : "Open issues", value: overview?.totals?.open ?? "—" },
            { label: isTamil ? "முக்கிய பாதுகாப்பு" : "Critical safety open", value: overview?.totals?.criticalSafetyOpen ?? "—" },
            { label: isTamil ? "தெரியாத செலவு" : "Unknown cost", value: overview?.totals?.unknownCost ?? "—" },
            { label: isTamil ? "கிடைக்கும் பட்ஜெட்" : "Available budget", value: money(recommendation?.availableBudget) },
          ].map((card) => (
            <div key={card.label} className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-[#64748b] font-bold">{card.label}</div>
              <div className="text-xl font-black text-[#0c1a30] mt-1">{loading ? "…" : card.value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {(
            [
              ["department", departments, isTamil ? "துறை" : "Department"],
              ["ward", wards, isTamil ? "வார்டு" : "Ward"],
              ["severity", ["low", "medium", "high", "critical"], isTamil ? "தீவிரம்" : "Severity"],
              ["status", ["submitted", "assigned", "in_progress", "verification", "resolved"], isTamil ? "நிலை" : "Status"],
            ] as const
          ).map(([key, options, label]) => (
            <label key={key} className="text-xs font-bold text-[#334155]">
              {label}
              <select
                className="mt-1 w-full border border-[#d0d5e2] rounded-xl px-2 py-2 font-medium"
                value={(filters as any)[key]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
              >
                <option value="all">{isTamil ? "அனைத்தும்" : "All"}</option>
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold text-[#0c1a30] mb-3">{isTamil ? "பட்ஜெட் ஒதுக்கீடு" : "Budget allocation"}</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1c3a6e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
              <div>{isTamil ? "பரிந்துரை செலவு" : "Recommended spend"}: {money(recommendation?.recommendedSpend)}</div>
              <div>{isTamil ? "தகுதியான பழுது" : "Eligible repairs"}: {money(recommendation?.eligibleRepairCost)}</div>
              <div>{isTamil ? "நிதியிடாத உயர்" : "Unfunded high"}: {recommendation?.unfundedHighPriority?.length ?? 0}</div>
              <div>{isTamil ? "முக்கிய மதிப்பாய்வு" : "Must-review critical"}: {recommendation?.mustReviewCritical?.length ?? 0}</div>
            </div>
            <p className="text-[11px] text-[#64748b] mt-2">{recommendation?.algorithm}</p>
          </div>
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 space-y-3">
            <h2 className="font-bold text-[#0c1a30]">{isTamil ? "பட்ஜெட் திட்டம்" : "Budget plan"}</h2>
            <input className="w-full border rounded-xl px-3 py-2 text-xs" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} />
            <input className="w-full border rounded-xl px-3 py-2 text-xs" value={budgetForm.availableBudget} onChange={(e) => setBudgetForm({ ...budgetForm, availableBudget: e.target.value })} />
            {canEdit && (
              <button onClick={createPlan} className="w-full bg-[#1c3a6e] text-white text-xs font-bold py-2 rounded-xl">
                {isTamil ? "திட்டத்தை சேமி" : "Save plan"}
              </button>
            )}
            {(recommendation?.limitations || []).map((item: string) => (
              <p key={item} className="text-[11px] text-[#64748b]">• {item}</p>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#d0d5e2] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#d0d5e2] font-bold">{isTamil ? "முன்னுரிமை அட்டவணை" : "Priority-ranked maintenance"}</div>
          {loading ? (
            <p className="p-4 text-sm text-[#64748b]">{isTamil ? "ஏற்றுகிறது…" : "Loading…"}</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-[#64748b]">{isTamil ? "வடிப்பானுக்கு புகார்கள் இல்லை." : "No complaints match these filters."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-[#f4f6fa] text-left">
                  <tr>
                    {["ID", isTamil ? "தலைப்பு" : "Title", isTamil ? "மதிப்பெண்" : "Score", isTamil ? "தீவிரம்" : "Severity", isTamil ? "பாதுகாப்பு" : "Safety", isTamil ? "மக்கள்" : "Population", isTamil ? "மீண்டும்" : "Recurrence", isTamil ? "செலவு" : "Cost", isTamil ? "துறை" : "Dept"].map((h) => (
                      <th key={h} className="px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.issue.id}
                      className={`border-t cursor-pointer ${selected?.issue?.id === row.issue.id ? "bg-[#e8eef8]" : ""}`}
                      onClick={() => setSelectedId(row.issue.id)}
                    >
                      <td className="px-3 py-2 font-mono">{row.issue.id}</td>
                      <td className="px-3 py-2">{row.issue.title}</td>
                      <td className="px-3 py-2 font-bold">{scoreLabel(row.score?.score, row.score?.scoreIncomplete)}</td>
                      <td className="px-3 py-2">{row.issue.priority || "Unavailable"}</td>
                      <td className="px-3 py-2">{row.issue.safetyRiskScore ?? "Unavailable"}</td>
                      <td className="px-3 py-2">{row.issue.affectedPopulation ?? "Unavailable"}</td>
                      <td className="px-3 py-2">{row.issue.recurrenceCount ?? "Unavailable"}</td>
                      <td className="px-3 py-2">{money(row.issue.costEstimate)}</td>
                      <td className="px-3 py-2">{row.issue.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 space-y-3">
            <h2 className="font-bold">{isTamil ? "மதிப்பெண் விளக்கம்" : "Priority explanation"}</h2>
            {selected ? (
              <>
                {selected.criticalSafetyHazard && (
                  <div className="text-xs bg-red-50 border border-red-200 text-red-800 rounded-xl p-2 font-semibold">
                    {isTamil ? "முக்கிய பாதுகாப்பு ஆபத்து — பட்ஜெட் இதை மறைக்காது." : "Critical safety hazard — budget constraints must not hide this case."}
                  </div>
                )}
                <p className="text-sm">{selected.score?.explanation}</p>
                <ul className="text-xs space-y-1">
                  {(selected.score?.factors || []).map((factor: any) => (
                    <li key={factor.key}>
                      <strong>{factor.label}</strong>: {factor.missing ? "Unavailable" : factor.normalizedScore} · {factor.source}
                    </li>
                  ))}
                </ul>
                {canEdit && (
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Cost" className="border rounded-xl px-2 py-1.5 text-xs" value={estimateForm.costEstimate} onChange={(e) => setEstimateForm({ ...estimateForm, costEstimate: e.target.value })} />
                    <input placeholder="Safety 0-100" className="border rounded-xl px-2 py-1.5 text-xs" value={estimateForm.safetyRiskScore} onChange={(e) => setEstimateForm({ ...estimateForm, safetyRiskScore: e.target.value })} />
                    <input placeholder="Population" className="border rounded-xl px-2 py-1.5 text-xs" value={estimateForm.affectedPopulation} onChange={(e) => setEstimateForm({ ...estimateForm, affectedPopulation: e.target.value })} />
                    <input placeholder="Road importance" className="border rounded-xl px-2 py-1.5 text-xs" value={estimateForm.roadImportanceScore} onChange={(e) => setEstimateForm({ ...estimateForm, roadImportanceScore: e.target.value })} />
                    <input placeholder={isTamil ? "மூலம்" : "Source of values"} className="border rounded-xl px-2 py-1.5 text-xs col-span-2" value={estimateForm.source} onChange={(e) => setEstimateForm({ ...estimateForm, source: e.target.value })} />
                    <button onClick={saveEstimates} className="col-span-2 bg-[#cf6009] text-white text-xs font-bold py-2 rounded-xl">{isTamil ? "மதிப்பீடு சேமி" : "Save estimates"}</button>
                    <button onClick={() => createWorkOrder(selected.issue.id)} className="col-span-2 border border-[#1c3a6e] text-[#1c3a6e] text-xs font-bold py-2 rounded-xl">{isTamil ? "பணி ஆணை உருவாக்கு" : "Create work order"}</button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[#64748b]">{isTamil ? "ஒரு வரிசையை தேர்ந்தெடுக்கவும்." : "Select a row."}</p>
            )}
          </div>
          <div className="bg-white border border-[#d0d5e2] rounded-2xl overflow-hidden min-h-[320px]">
            <CivicMap height="320px" enableHeatmapToggle enableFilters={false} />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold mb-2">{isTamil ? "பரிந்துரைக்கப்பட்ட பழுது" : "Recommended repairs"}</h2>
            <ul className="text-xs space-y-1">
              {(recommendation?.recommended || []).map((item: any) => (
                <li key={item.id}>{item.id} · {item.title} · {money(item.estimatedCost)} · score {scoreLabel(item.priorityScore)}</li>
              ))}
              {(recommendation?.recommended || []).length === 0 && <li>{isTamil ? "பரிந்துரைகள் இல்லை." : "No funded set for the current envelope."}</li>}
            </ul>
          </div>
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold mb-2">{isTamil ? "நிதியிடாத உயர் முன்னுரிமை" : "Unfunded high-priority"}</h2>
            <ul className="text-xs space-y-1">
              {(recommendation?.unfundedHighPriority || []).map((item: any) => (
                <li key={item.id}>{item.id} · {item.title} · {money(item.estimatedCost)}</li>
              ))}
              {(recommendation?.mustReviewCritical || []).map((item: any) => (
                <li key={`c-${item.id}`} className="text-red-700 font-semibold">{item.id} · critical safety still requires review</li>
              ))}
              {(recommendation?.unfundedHighPriority || []).length === 0 && (recommendation?.mustReviewCritical || []).length === 0 && (
                <li>{isTamil ? "நிதியிடாத உயர் முன்னுரிமை இல்லை." : "No unfunded high-priority items in this plan."}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 space-y-3">
          <h2 className="font-bold">{isTamil ? "புகார் ஒப்பீடு" : "Side-by-side comparison"}</h2>
          <div className="flex flex-wrap gap-2">
            <select className="border rounded-xl px-2 py-2 text-xs" value={compareA} onChange={(e) => setCompareA(e.target.value)}>
              <option value="">{isTamil ? "புகார் A" : "Complaint A"}</option>
              {rows.map((r) => <option key={r.issue.id} value={r.issue.id}>{r.issue.id}</option>)}
            </select>
            <select className="border rounded-xl px-2 py-2 text-xs" value={compareB} onChange={(e) => setCompareB(e.target.value)}>
              <option value="">{isTamil ? "புகார் B" : "Complaint B"}</option>
              {rows.map((r) => <option key={r.issue.id} value={r.issue.id}>{r.issue.id}</option>)}
            </select>
            <button onClick={runCompare} className="bg-[#1c3a6e] text-white text-xs font-bold px-4 py-2 rounded-xl">{isTamil ? "ஒப்பிடு" : "Compare"}</button>
          </div>
          {comparison && (
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              {[comparison.a, comparison.b].map((side: any) => (
                <div key={side.issue.id} className="border rounded-xl p-3">
                  <div className="font-bold">{side.issue.id}</div>
                  <div>{side.issue.title}</div>
                  <div>Score {scoreLabel(side.score.score, side.score.scoreIncomplete)}</div>
                  <div>Safety {side.issue.safetyRiskScore ?? "Unavailable"} · Cost {money(side.issue.costEstimate)}</div>
                </div>
              ))}
              <p className="md:col-span-2 text-[#334155]">{comparison.ranking}</p>
            </div>
          )}
        </div>

        {staffRole === "admin" && (
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4">
            <h2 className="font-bold mb-2">{isTamil ? "முன்னுரிமை எடைகள்" : "Configurable weights"}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {Object.keys(weights).map((key) => (
                <label key={key} className="text-[11px] font-bold">
                  {key}
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded-xl px-2 py-1.5"
                    value={(weights as any)[key]}
                    onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                  />
                </label>
              ))}
            </div>
            <button onClick={saveWeights} className="mt-3 bg-[#1c3a6e] text-white text-xs font-bold px-4 py-2 rounded-xl">{isTamil ? "எடைகள் சேமி" : "Save weights"}</button>
          </div>
        )}
      </div>
    </main>
  )
}
