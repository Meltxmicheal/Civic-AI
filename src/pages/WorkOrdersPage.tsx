import { useCallback, useEffect, useMemo, useState } from "react"
import { PersistenceNotice, downloadText, money } from "../components/OpsChrome"
import { useApp } from "../contexts/AppContext"
import { opsApi } from "../services/opsApi"

const NEXT_ACTIONS: Record<string, string[]> = {
  created: ["assigned"],
  assigned: ["accepted"],
  accepted: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  verified: ["reopened"],
  rejected: ["reopened"],
  reopened: ["assigned"],
}

export function WorkOrdersPage() {
  const { lang, staffRole } = useApp()
  const isTamil = lang === "ta"
  const official = staffRole === "admin" || staffRole === "department"
  const canAdvance = official || staffRole === "officer" || staffRole === "contractor"

  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [contractors, setContractors] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [complaintId, setComplaintId] = useState("")
  const [assignId, setAssignId] = useState("")
  const [newContractor, setNewContractor] = useState({ name: "", email: "", department: "", password: "pass123" })
  const [evidence, setEvidence] = useState({ afterImageUrl: "", repairNotes: "" })
  const [performance, setPerformance] = useState<any>(null)
  const [contractorPerf, setContractorPerf] = useState<any>(null)
  const [recurrence, setRecurrence] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [persistence, setPersistence] = useState<{ persistence?: string; persistedToDatabase?: boolean }>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const qs = statusFilter === "all" ? "" : `?status=${statusFilter}`
      const wo = await opsApi.workOrders(qs)
      setWorkOrders(wo.data || [])
      setPersistence({ persistence: wo.persistence, persistedToDatabase: wo.persistedToDatabase })
      if (staffRole !== "contractor") {
        const [cons, scan] = await Promise.all([opsApi.contractors(), opsApi.recurrenceScan()])
        setContractors(cons.data || [])
        setRecurrence(scan.data || [])
      }
    } catch (err: any) {
      setError(err.message || "Unable to load work orders.")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, staffRole])

  useEffect(() => {
    load()
  }, [load])

  const selected = useMemo(() => workOrders.find((w) => w.id === selectedId) || workOrders[0], [workOrders, selectedId])

  async function createOrder() {
    try {
      await opsApi.createWorkOrder({ complaintId })
      setNotice(isTamil ? "பணி ஆணை உருவாக்கப்பட்டது." : "Work order created.")
      setComplaintId("")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function assign() {
    if (!selected?.id || !assignId) return
    try {
      await opsApi.assignWorkOrder(selected.id, assignId)
      setNotice(isTamil ? "ஒதுக்கப்பட்டது." : "Work order assigned (reassignment is audited).")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function advance(status: string) {
    if (!selected?.id) return
    try {
      await opsApi.updateWorkOrderStatus(selected.id, status, { repairNotes: evidence.repairNotes })
      setNotice(`${isTamil ? "நிலை" : "Status"} → ${status}`)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function submitEvidence() {
    if (!selected?.id) return
    try {
      await opsApi.submitEvidence(selected.id, evidence)
      setNotice(isTamil ? "ஆதாரம் சேமிக்கப்பட்டது. இது சரிபார்ப்பு அல்ல." : "Evidence stored. Photograph upload does not verify the work.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function verify(decision: "verified" | "rejected") {
    if (!selected?.id) return
    try {
      await opsApi.verifyWorkOrder(selected.id, { decision, note: evidence.repairNotes })
      setNotice(decision === "verified" ? "Official verification recorded." : "Completion rejected; work reopened.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function registerContractor() {
    try {
      await opsApi.createContractor(newContractor)
      setNotice(isTamil ? "ஒப்பந்ததாரர் பதிவு." : "Contractor registered.")
      setNewContractor({ name: "", email: "", department: "", password: "pass123" })
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function loadReport() {
    try {
      const report = await opsApi.performanceReport()
      setPerformance(report.data)
      const metrics = report.data?.metrics || {}
      const csv = [
        "metric,value,denominator,definition",
        `onTimeCompletionRate,${metrics.onTimeCompletionRate},${metrics.onTimeDenominator},"${metrics.definitions?.onTimeCompletionRate || ""}"`,
        `averageCompletionHours,${metrics.averageCompletionHours},${metrics.averageCompletionDenominator},"${metrics.definitions?.averageCompletionHours || ""}"`,
        `slaComplianceRate,${metrics.slaComplianceRate},${metrics.slaDenominator},"${metrics.definitions?.slaComplianceRate || ""}"`,
        `repeatFailureRate,${metrics.repeatFailureRate},${metrics.repeatFailureDenominator},"${metrics.definitions?.repeatFailureRate || ""}"`,
        `completionRate,${metrics.completionRate},,"${metrics.definitions?.completionRate || ""}"`,
        `verifiedCompletionRate,${metrics.verifiedCompletionRate},,"${metrics.definitions?.verifiedCompletionRate || ""}"`,
      ].join("\n")
      downloadText("contractor-department-performance.csv", csv)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function loadContractorPerf(id: string) {
    try {
      const res = await opsApi.contractorPerformance(id)
      setContractorPerf(res.data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function reviewRecurrence(item: any, status: "confirmed" | "rejected") {
    try {
      await opsApi.reviewRecurrence(item.reviewId || `REC-${item.currentIssueId}`, {
        status,
        currentIssueId: item.currentIssueId,
        previousIssueId: item.previousIssueId,
        previousWorkOrderId: item.previousWorkOrder?.id,
        distanceMeters: item.distanceMeters,
      })
      setNotice(status === "confirmed" ? "Recurrence confirmed and counted." : "Candidate rejected; metrics unchanged.")
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const next = selected ? NEXT_ACTIONS[selected.status] || [] : []

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      <div className="bg-[#1c3a6e] text-white px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">{isTamil ? "பணி மேலாண்மை" : "Work-order intelligence"}</p>
          <h1 className={`text-2xl font-black mt-1 ${isTamil ? "font-tamil" : ""}`}>{isTamil ? "பணி ஆணைகள்" : "Work Orders"}</h1>
          <p className="text-sm text-white/80 mt-1 max-w-3xl">
            {isTamil
              ? "புகாருடன் இணைந்த பணி ஆணைகள், ஒப்பந்ததாரர் செயல்திறன் மற்றும் அதிகாரப்பூர்வ சரிபார்ப்பு."
              : "Linked work orders, contractor assignments, evidence, official verification, and performance calculated from stored records."}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        <PersistenceNotice persistence={persistence.persistence} persistedToDatabase={persistence.persistedToDatabase} />
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>}
        {notice && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">{notice}</div>}

        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs font-bold">
            {isTamil ? "நிலை" : "Status"}
            <select className="block border rounded-xl px-2 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">all</option>
              {["created", "assigned", "accepted", "in_progress", "completed", "verified", "rejected", "reopened"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          {official && (
            <>
              <input className="border rounded-xl px-3 py-2 text-xs" placeholder="Complaint ID" value={complaintId} onChange={(e) => setComplaintId(e.target.value)} />
              <button onClick={createOrder} className="bg-[#1c3a6e] text-white text-xs font-bold px-4 py-2 rounded-xl">{isTamil ? "உருவாக்கு" : "Create work order"}</button>
              <button onClick={loadReport} className="border border-[#1c3a6e] text-[#1c3a6e] text-xs font-bold px-4 py-2 rounded-xl">{isTamil ? "அறிக்கை பதிவிறக்கு" : "Download performance CSV"}</button>
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-[#d0d5e2] rounded-2xl overflow-hidden">
            {loading ? (
              <p className="p-4 text-sm">{isTamil ? "ஏற்றுகிறது…" : "Loading…"}</p>
            ) : workOrders.length === 0 ? (
              <p className="p-4 text-sm text-[#64748b]">{isTamil ? "பணி ஆணைகள் இல்லை." : "No work orders in this filter."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-[#f4f6fa] text-left">
                    <tr>
                      {["ID", isTamil ? "புகார்" : "Complaint", isTamil ? "நிலை" : "Status", isTamil ? "ஒப்பந்ததாரர்" : "Contractor", isTamil ? "செலவு" : "Cost", isTamil ? "காலக்கெடு" : "Due"].map((h) => (
                        <th key={h} className="px-3 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((wo) => (
                      <tr key={wo.id} className={`border-t cursor-pointer ${selected?.id === wo.id ? "bg-[#e8eef8]" : ""}`} onClick={() => setSelectedId(wo.id)}>
                        <td className="px-3 py-2 font-mono">{wo.id}</td>
                        <td className="px-3 py-2">{wo.complaintId}</td>
                        <td className="px-3 py-2">{wo.status}</td>
                        <td className="px-3 py-2">{wo.contractorName || "Unassigned"}</td>
                        <td className="px-3 py-2">{money(wo.estimatedCost)}</td>
                        <td className="px-3 py-2">{wo.dueDate ? new Date(wo.dueDate).toLocaleString() : "Unavailable"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 space-y-3 text-xs">
            <h2 className="font-bold text-sm">{isTamil ? "தேர்ந்தெடுத்த பணி" : "Selected work order"}</h2>
            {selected ? (
              <>
                <p><strong>{selected.id}</strong> · {selected.workDescription}</p>
                <p>{isTamil ? "நிலை" : "Status"}: {selected.status} · {isTamil ? "சரிபார்ப்பு" : "Verification"}: {selected.verificationStatus}</p>
                <p>{selected.location} · {selected.ward || "Ward unavailable"}</p>
                <p>{isTamil ? "முன்னுரிமை" : "Priority"}: {selected.priorityScore ?? "Unavailable"}</p>
                {official && (
                  <div className="flex gap-2">
                    <select className="flex-1 border rounded-xl px-2 py-1.5" value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                      <option value="">{isTamil ? "ஒப்பந்ததாரர்" : "Contractor"}</option>
                      {contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button onClick={assign} className="bg-[#1c3a6e] text-white px-3 rounded-xl font-bold">{isTamil ? "ஒதுக்கு" : "Assign"}</button>
                  </div>
                )}
                {canAdvance && (
                  <div className="flex flex-wrap gap-2">
                    {next.filter((s) => s !== "assigned").map((s) => (
                      <button key={s} onClick={() => advance(s)} className="border rounded-xl px-3 py-1.5 font-bold">{s}</button>
                    ))}
                  </div>
                )}
                <textarea className="w-full border rounded-xl p-2" rows={2} placeholder={isTamil ? "பழுது குறிப்புகள்" : "Repair notes"} value={evidence.repairNotes} onChange={(e) => setEvidence({ ...evidence, repairNotes: e.target.value })} />
                <input className="w-full border rounded-xl px-2 py-1.5" placeholder={isTamil ? "பின் பட URL" : "After-image URL"} value={evidence.afterImageUrl} onChange={(e) => setEvidence({ ...evidence, afterImageUrl: e.target.value })} />
                <button onClick={submitEvidence} className="w-full border border-[#1c3a6e] text-[#1c3a6e] font-bold py-2 rounded-xl">{isTamil ? "ஆதாரம் சமர்ப்பி" : "Submit evidence"}</button>
                {official && selected.status === "completed" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => verify("verified")} className="bg-emerald-700 text-white font-bold py-2 rounded-xl">{isTamil ? "சரிபார்" : "Verify"}</button>
                    <button onClick={() => verify("rejected")} className="bg-red-700 text-white font-bold py-2 rounded-xl">{isTamil ? "நிராகரி" : "Reject"}</button>
                  </div>
                )}
                <div className="text-[11px] text-[#64748b] space-y-1 max-h-28 overflow-auto">
                  {(selected.audit || []).map((event: any, idx: number) => (
                    <p key={idx}>{event.at} · {event.actor} · {event.action} {event.fromStatus || ""} → {event.toStatus || ""} {event.note || ""}</p>
                  ))}
                </div>
              </>
            ) : (
              <p>{isTamil ? "பணி ஆணை இல்லை." : "Select a work order."}</p>
            )}
          </div>
        </div>

        {official && (
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 space-y-2 text-xs">
              <h2 className="font-bold text-sm">{isTamil ? "ஒப்பந்ததாரர் பதிவு" : "Register contractor"}</h2>
              <input className="w-full border rounded-xl px-2 py-1.5" placeholder="Name" value={newContractor.name} onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })} />
              <input className="w-full border rounded-xl px-2 py-1.5" placeholder="Email" value={newContractor.email} onChange={(e) => setNewContractor({ ...newContractor, email: e.target.value })} />
              <input className="w-full border rounded-xl px-2 py-1.5" placeholder="Department" value={newContractor.department} onChange={(e) => setNewContractor({ ...newContractor, department: e.target.value })} />
              <button onClick={registerContractor} className="bg-[#1c3a6e] text-white font-bold px-4 py-2 rounded-xl">{isTamil ? "பதிவு" : "Register"}</button>
              <ul className="space-y-1">
                {contractors.map((c) => (
                  <li key={c.id}>
                    <button className="underline" onClick={() => loadContractorPerf(c.id)}>{c.name}</button> · {c.email} · {c.department}
                  </li>
                ))}
              </ul>
              {contractorPerf && (
                <div className="border rounded-xl p-2">
                  <p className="font-bold">{contractorPerf.contractor?.name}</p>
                  <p>On-time: {contractorPerf.metrics?.onTimeCompletionRate ?? "Unavailable"}% (n={contractorPerf.metrics?.onTimeDenominator})</p>
                  <p>SLA: {contractorPerf.metrics?.slaComplianceRate ?? "Unavailable"}%</p>
                  <p>Repeat failure: {contractorPerf.metrics?.repeatFailureRate ?? "Unavailable"}%</p>
                  <p>Verified completion: {contractorPerf.metrics?.verifiedCompletionRate ?? "Unavailable"}%</p>
                </div>
              )}
            </div>
            <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 text-xs space-y-2">
              <h2 className="font-bold text-sm">{isTamil ? "மீண்டும் வரும் சிக்கல்கள்" : "Recurrence review"}</h2>
              <p className="text-[#64748b]">Nearby same-category complaints are candidates only. Confirming updates recurrence metrics; rejecting does not.</p>
              {(recurrence || []).slice(0, 12).map((item, idx) => (
                <div key={`${item.currentIssueId}-${idx}`} className="border rounded-xl p-2">
                  <p>{item.currentIssueId} ← {item.previousIssueId} · {Math.round(item.distanceMeters)}m · {item.reviewStatus}</p>
                  <p>{item.previousWorkOrder ? `WO ${item.previousWorkOrder.id}` : "No prior work order"}</p>
                  {item.reviewStatus === "candidate" && (
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => reviewRecurrence(item, "confirmed")} className="bg-[#1c3a6e] text-white px-2 py-1 rounded-lg">{isTamil ? "உறுதி" : "Confirm"}</button>
                      <button onClick={() => reviewRecurrence(item, "rejected")} className="border px-2 py-1 rounded-lg">{isTamil ? "நிராகரி" : "Reject"}</button>
                    </div>
                  )}
                </div>
              ))}
              {(recurrence || []).length === 0 && <p>{isTamil ? "வேட்பாளர்கள் இல்லை." : "No recurrence candidates under the 75m / 180-day rule."}</p>}
            </div>
          </div>
        )}

        {performance && (
          <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 text-xs">
            <h2 className="font-bold text-sm mb-2">{isTamil ? "செயல்திறன் அறிக்கை" : "Performance report (from stored work orders)"}</h2>
            <p>Assigned {performance.metrics?.totalAssigned} · Completed {performance.metrics?.completed} · Pending {performance.metrics?.pending} · SLA breaches {performance.metrics?.slaBreaches}</p>
            <p>Estimated spend {money(performance.metrics?.estimatedCostTotal)} · Approved {money(performance.metrics?.approvedCostTotal)}</p>
            {(performance.metrics?.insufficientData || []).map((note: string) => <p key={note} className="text-[#64748b]">{note}</p>)}
          </div>
        )}
      </div>
    </main>
  )
}
