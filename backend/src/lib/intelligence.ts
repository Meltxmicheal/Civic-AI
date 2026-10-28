export type TrendIssue = {
  id: string
  submittedAt: string
  resolvedAt?: string | null
  status: string
  department: string
  category: string
  ward?: string
  zone?: string
  lat?: number
  lng?: number
  costEstimate?: number | null
  costUnknown?: boolean
}

function parseDate(value?: string | null): number | null {
  if (!value) return null
  const t = Date.parse(value)
  return Number.isFinite(t) ? t : null
}

function hoursBetween(start?: string | null, end?: string | null): number | null {
  const a = parseDate(start)
  const b = parseDate(end)
  if (a === null || b === null || b < a) return null
  return (b - a) / 36e5
}

export function aggregateTrends(issues: TrendIssue[], confirmedRecurrenceIssueIds: Set<string>) {
  const byDay: Record<string, { reported: number; resolved: number; unresolved: number }> = {}
  const byDepartment: Record<string, { count: number; resolved: number; resolutionHours: number[]; slaUnknown: number }> = {}
  const byCategory: Record<string, number> = {}

  for (const issue of issues) {
    const day = (issue.submittedAt || "").slice(0, 10) || "unknown"
    if (!byDay[day]) byDay[day] = { reported: 0, resolved: 0, unresolved: 0 }
    byDay[day].reported += 1
    if (issue.status === "resolved") byDay[day].resolved += 1
    else byDay[day].unresolved += 1

    const dept = issue.department || "Unspecified"
    if (!byDepartment[dept]) byDepartment[dept] = { count: 0, resolved: 0, resolutionHours: [], slaUnknown: 0 }
    byDepartment[dept].count += 1
    if (issue.status === "resolved") {
      byDepartment[dept].resolved += 1
      const hours = hoursBetween(issue.submittedAt, issue.resolvedAt)
      if (hours !== null) byDepartment[dept].resolutionHours.push(hours)
    }

    byCategory[issue.category || "other"] = (byCategory[issue.category || "other"] || 0) + 1
  }

  const volume = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))

  const departmentResolution = Object.entries(byDepartment).map(([department, values]) => ({
    department,
    complaints: values.count,
    resolved: values.resolved,
    averageResolutionHours:
      values.resolutionHours.length === 0
        ? null
        : Math.round((values.resolutionHours.reduce((a, b) => a + b, 0) / values.resolutionHours.length) * 10) / 10,
    resolutionSampleSize: values.resolutionHours.length,
  }))

  const unresolved = issues.filter((i) => i.status !== "resolved" && i.status !== "closed").length

  return {
    complaintVolumeOverTime: volume,
    unresolvedComplaints: unresolved,
    recurringInfrastructureProblems: Array.from(confirmedRecurrenceIssueIds),
    resolutionTimesByDepartment: departmentResolution,
    categoryCounts: byCategory,
    notes: [
      "Trends describe recorded complaints only and do not prove causation.",
      "Average resolution time uses resolvedAt when present; otherwise that complaint is excluded from the average.",
    ],
    insufficientData: volume.length < 2 ? ["Fewer than two dated periods are available for comparison."] : [],
  }
}

export function aggregateAreas(issues: TrendIssue[]) {
  const groups: Record<string, {
    label: string
    kind: "ward" | "zone" | "unspecified"
    count: number
    unresolved: number
    highPriorityUnresolved: number
    resolutionHours: number[]
    departments: Record<string, number>
    spend: number
    spendUnknown: number
  }> = {}

  for (const issue of issues) {
    const label = issue.ward || issue.zone || "Unspecified (no ward/zone on record)"
    const kind: "ward" | "zone" | "unspecified" = issue.ward ? "ward" : issue.zone ? "zone" : "unspecified"
    if (!groups[label]) {
      groups[label] = {
        label,
        kind,
        count: 0,
        unresolved: 0,
        highPriorityUnresolved: 0,
        resolutionHours: [],
        departments: {},
        spend: 0,
        spendUnknown: 0,
      }
    }
    const g = groups[label]
    g.count += 1
    if (issue.status !== "resolved" && issue.status !== "closed") g.unresolved += 1
    g.departments[issue.department || "Unspecified"] = (g.departments[issue.department || "Unspecified"] || 0) + 1
    const hours = hoursBetween(issue.submittedAt, issue.resolvedAt)
    if (hours !== null) g.resolutionHours.push(hours)
    if (issue.costUnknown !== false && (issue.costEstimate === null || issue.costEstimate === undefined)) {
      g.spendUnknown += 1
    } else if (typeof issue.costEstimate === "number") {
      g.spend += issue.costEstimate
    }
  }

  return {
    boundaryDisclaimer:
      "Areas are grouped by ward/zone labels stored on complaints. These are not official GIS polygons and must not be treated as legal ward boundaries.",
    areas: Object.values(groups).map((g) => ({
      label: g.label,
      kind: g.kind,
      complaintCount: g.count,
      unresolved: g.unresolved,
      averageResolutionHours:
        g.resolutionHours.length === 0
          ? null
          : Math.round((g.resolutionHours.reduce((a, b) => a + b, 0) / g.resolutionHours.length) * 10) / 10,
      resolutionSampleSize: g.resolutionHours.length,
      departmentWorkload: g.departments,
      maintenanceSpend: g.spend,
      spendUnknownRecords: g.spendUnknown,
    })),
  }
}
