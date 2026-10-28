import {
  calculatePriorityScore,
  isCriticalSafetyHazard,
  type PriorityScoreResult,
  type PriorityWeights,
} from "./priority.js"

export function scoreIssue(issue: any, weights: PriorityWeights): PriorityScoreResult {
  return calculatePriorityScore(
    {
      safetyRiskScore: issue.safetyRiskScore,
      severity: issue.priority,
      affectedPopulation: issue.affectedPopulation,
      recurrenceCount: issue.recurrenceCount,
      roadImportanceScore: issue.roadImportanceScore,
      sources: {
        safetyRisk: issue.safetyRiskSource,
        severity: "complaint.priority",
        affectedPopulation: issue.affectedPopulationSource,
        recurrence: "confirmed-recurrence-count",
        roadImportance: issue.roadImportanceSource,
      },
    },
    weights,
  )
}

export function toBudgetCandidate(issue: any, scored: PriorityScoreResult) {
  const costUnknown = issue.costUnknown !== false && (issue.costEstimate === null || issue.costEstimate === undefined)
  return {
    id: issue.id,
    title: issue.title,
    priorityScore: scored.score,
    scoreIncomplete: scored.scoreIncomplete,
    estimatedCost: costUnknown ? null : issue.costEstimate,
    safetyRiskScore: issue.safetyRiskScore ?? null,
    severity: issue.priority ?? null,
    department: issue.department,
    ward: issue.ward,
    criticalSafetyHazard: isCriticalSafetyHazard({
      safetyRiskScore: issue.safetyRiskScore,
      severity: issue.priority,
    }),
  }
}

export function publicIssue(issue: any) {
  if (!issue) return issue
  const { citizenPhone, citizenMobile, ...rest } = issue
  return rest
}
