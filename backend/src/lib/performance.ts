export type WorkOrderMetricRecord = {
  id: string
  contractorId?: string | null
  department?: string | null
  category?: string | null
  status: string
  createdAt?: string | null
  assignedAt?: string | null
  startDate?: string | null
  dueDate?: string | null
  completionDate?: string | null
  slaHours?: number | null
  estimatedCost?: number | null
  approvedCost?: number | null
  confirmedRecurrence?: boolean
  citizenUpvotes?: number | null
  citizenDownvotes?: number | null
}

export type PerformanceMetrics = {
  definitions: Record<string, string>
  totalAssigned: number
  completed: number
  pending: number
  verified: number
  rejected: number
  onTimeCompletionRate: number | null
  onTimeDenominator: number
  averageCompletionHours: number | null
  averageCompletionDenominator: number
  slaComplianceRate: number | null
  slaDenominator: number
  repeatFailureRate: number | null
  repeatFailureDenominator: number
  completionRate: number | null
  verifiedCompletionRate: number | null
  citizenFeedbackScore: number | null
  citizenFeedbackDenominator: number
  estimatedCostTotal: number
  approvedCostTotal: number
  slaBreaches: number
  byCategory: Record<string, { total: number; completed: number; avgHours: number | null }>
  insufficientData: string[]
}

function hoursBetween(start?: string | null, end?: string | null): number | null {
  if (!start || !end) return null
  const a = Date.parse(start)
  const b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null
  return (b - a) / 36e5
}

function isCompleted(status: string): boolean {
  return status === "completed" || status === "verified"
}

export function calculatePerformanceMetrics(records: WorkOrderMetricRecord[]): PerformanceMetrics {
  const assignedLike = records.filter((r) => r.status !== "created")
  const completed = records.filter((r) => isCompleted(r.status))
  const verified = records.filter((r) => r.status === "verified")
  const pending = records.filter((r) =>
    ["created", "assigned", "accepted", "in_progress", "reopened"].includes(r.status),
  )
  const rejected = records.filter((r) => r.status === "rejected")

  const onTimeEligible = completed.filter((r) => r.completionDate && r.dueDate)
  const onTime = onTimeEligible.filter((r) => Date.parse(r.completionDate!) <= Date.parse(r.dueDate!))

  const durationEligible = completed
    .map((r) => hoursBetween(r.startDate || r.assignedAt || r.createdAt, r.completionDate))
    .filter((v): v is number => v !== null)

  const slaEligible = completed.filter((r) => r.completionDate && (r.dueDate || r.slaHours != null))
  const slaOk = slaEligible.filter((r) => {
    if (r.dueDate) return Date.parse(r.completionDate!) <= Date.parse(r.dueDate)
    const hours = hoursBetween(r.createdAt, r.completionDate)
    return hours !== null && r.slaHours != null && hours <= r.slaHours
  })

  const verifiedOrCompleted = records.filter((r) => isCompleted(r.status))
  const recurrenceEligible = verified
  const recurrenceHits = verified.filter((r) => r.confirmedRecurrence)

  const actionable = records.filter((r) => !["created", "rejected"].includes(r.status))

  const feedbackEligible = records.filter(
    (r) => (r.citizenUpvotes || 0) + (r.citizenDownvotes || 0) > 0,
  )
  const feedbackScore =
    feedbackEligible.length === 0
      ? null
      : feedbackEligible.reduce((sum, r) => {
          const total = (r.citizenUpvotes || 0) + (r.citizenDownvotes || 0)
          return sum + ((r.citizenUpvotes || 0) / total) * 100
        }, 0) / feedbackEligible.length

  const byCategory: PerformanceMetrics["byCategory"] = {}
  for (const record of records) {
    const key = record.category || "unspecified"
    if (!byCategory[key]) byCategory[key] = { total: 0, completed: 0, avgHours: null }
    byCategory[key].total += 1
    if (isCompleted(record.status)) byCategory[key].completed += 1
  }
  for (const [key, bucket] of Object.entries(byCategory)) {
    const hours = records
      .filter((r) => (r.category || "unspecified") === key && isCompleted(r.status))
      .map((r) => hoursBetween(r.startDate || r.assignedAt || r.createdAt, r.completionDate))
      .filter((v): v is number => v !== null)
    bucket.avgHours = hours.length ? round2(hours.reduce((a, b) => a + b, 0) / hours.length) : null
  }

  const insufficientData: string[] = []
  if (onTimeEligible.length === 0) insufficientData.push("on-time completion requires completionDate and dueDate")
  if (durationEligible.length === 0) insufficientData.push("average completion time requires start/assignment and completion dates")
  if (slaEligible.length === 0) insufficientData.push("SLA compliance requires completion dates plus dueDate or slaHours")
  if (recurrenceEligible.length === 0) insufficientData.push("repeat-failure rate requires verified work orders")
  if (feedbackEligible.length === 0) insufficientData.push("citizen feedback proxy requires upvotes/downvotes on linked complaints")

  const estimatedCostTotal = records.reduce((s, r) => s + (typeof r.estimatedCost === "number" ? r.estimatedCost : 0), 0)
  const approvedCostTotal = records.reduce((s, r) => s + (typeof r.approvedCost === "number" ? r.approvedCost : 0), 0)

  return {
    definitions: {
      onTimeCompletionRate:
        "Share of completed/verified work orders with both completionDate and dueDate where completionDate <= dueDate. Missing dates excluded from the denominator.",
      averageCompletionTime:
        "Mean hours from startDate (fallback: assignedAt, then createdAt) to completionDate for completed/verified records with valid dates.",
      slaComplianceRate:
        "Share of completed/verified work orders finished by dueDate, or within slaHours of createdAt when dueDate is absent. Missing inputs excluded.",
      repeatFailureRate:
        "Share of verified work orders later linked to a confirmed recurrence. Nearby unverified complaints are not counted.",
      workOrderCompletionRate:
        "Completed + verified work orders divided by work orders that are not still in created or rejected.",
      verifiedCompletionRate:
        "Verified work orders divided by completed + verified. Photograph upload alone does not verify work.",
      citizenFeedbackSummary:
        "Proxy only: mean upvote share on linked complaints. This is not a formal citizen satisfaction survey.",
    },
    totalAssigned: assignedLike.length,
    completed: completed.length,
    pending: pending.length,
    verified: verified.length,
    rejected: rejected.length,
    onTimeCompletionRate: rate(onTime.length, onTimeEligible.length),
    onTimeDenominator: onTimeEligible.length,
    averageCompletionHours: durationEligible.length
      ? round2(durationEligible.reduce((a, b) => a + b, 0) / durationEligible.length)
      : null,
    averageCompletionDenominator: durationEligible.length,
    slaComplianceRate: rate(slaOk.length, slaEligible.length),
    slaDenominator: slaEligible.length,
    slaBreaches: slaEligible.length - slaOk.length,
    repeatFailureRate: rate(recurrenceHits.length, recurrenceEligible.length),
    repeatFailureDenominator: recurrenceEligible.length,
    completionRate: rate(verifiedOrCompleted.length, actionable.length),
    verifiedCompletionRate: rate(verified.length, verifiedOrCompleted.length),
    citizenFeedbackScore: feedbackScore === null ? null : round2(feedbackScore),
    citizenFeedbackDenominator: feedbackEligible.length,
    estimatedCostTotal,
    approvedCostTotal,
    byCategory,
    insufficientData,
  }
}

function rate(num: number, den: number): number | null {
  if (!den) return null
  return round2((num / den) * 100)
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
