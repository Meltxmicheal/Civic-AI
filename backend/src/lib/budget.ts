import { isCriticalSafetyHazard } from "./priority.js"

export type BudgetCandidate = {
  id: string
  title: string
  priorityScore: number | null
  scoreIncomplete: boolean
  estimatedCost: number | null
  safetyRiskScore: number | null
  severity: string | null
  department?: string
  ward?: string
}

export type BudgetRecommendation = {
  algorithm: string
  limitations: string[]
  availableBudget: number
  eligibleRepairCost: number
  unknownCostCount: number
  recommended: BudgetCandidate[]
  recommendedSpend: number
  remainingBudget: number
  unfundedHighPriority: BudgetCandidate[]
  unfundedCritical: BudgetCandidate[]
  mustReviewCritical: BudgetCandidate[]
  ineligibleUnknownCost: BudgetCandidate[]
  ineligibleUnknownScore: BudgetCandidate[]
}

const HIGH_PRIORITY_THRESHOLD = 70

export function validateBudgetAmount(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Budget amount must be a finite number greater than or equal to 0.")
  }
  return amount
}

export function validateCost(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount < 0) {
    throw new Error("Repair cost must be a finite number greater than or equal to 0.")
  }
  return amount
}

/**
 * Critical-first greedy knapsack by priority density (score / cost).
 * Critical safety hazards are never dropped from the review list, even if unfunded.
 */
export function recommendBudgetAllocation(
  candidates: BudgetCandidate[],
  availableBudget: number,
): BudgetRecommendation {
  const budget = validateBudgetAmount(availableBudget)
  const ineligibleUnknownCost: BudgetCandidate[] = []
  const ineligibleUnknownScore: BudgetCandidate[] = []
  const eligible: BudgetCandidate[] = []

  for (const item of candidates) {
    if (item.estimatedCost === null || item.estimatedCost === undefined) {
      ineligibleUnknownCost.push(item)
      continue
    }
    validateCost(item.estimatedCost)
    if (item.priorityScore === null || item.priorityScore === undefined) {
      ineligibleUnknownScore.push(item)
      continue
    }
    eligible.push(item)
  }

  const critical = eligible.filter((item) =>
    isCriticalSafetyHazard({
      safetyRiskScore: item.safetyRiskScore,
      severity: item.severity,
    }),
  )
  const nonCritical = eligible.filter((item) => !critical.includes(item))

  const recommended: BudgetCandidate[] = []
  let remaining = budget

  const byDensity = (a: BudgetCandidate, b: BudgetCandidate) => {
    const da = (a.priorityScore || 0) / Math.max(a.estimatedCost || 1, 1)
    const db = (b.priorityScore || 0) / Math.max(b.estimatedCost || 1, 1)
    if (db !== da) return db - da
    return (b.priorityScore || 0) - (a.priorityScore || 0)
  }

  const tryAdd = (item: BudgetCandidate) => {
    const cost = item.estimatedCost as number
    if (cost <= remaining) {
      recommended.push(item)
      remaining -= cost
      return true
    }
    return false
  }

  const unfundedCritical: BudgetCandidate[] = []
  for (const item of [...critical].sort(byDensity)) {
    if (!tryAdd(item)) unfundedCritical.push(item)
  }

  const unfundedNonCritical: BudgetCandidate[] = []
  for (const item of [...nonCritical].sort(byDensity)) {
    if (!tryAdd(item)) unfundedNonCritical.push(item)
  }

  const unfundedHighPriority = [...unfundedCritical, ...unfundedNonCritical].filter(
    (item) => (item.priorityScore || 0) >= HIGH_PRIORITY_THRESHOLD ||
      isCriticalSafetyHazard({ safetyRiskScore: item.safetyRiskScore, severity: item.severity }),
  )

  const eligibleRepairCost = eligible.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
  const recommendedSpend = recommended.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)

  return {
    algorithm:
      "Critical-first greedy knapsack: fund critical safety hazards first, then remaining items by priority-score / estimated-cost density, skipping any item that exceeds remaining budget.",
    limitations: [
      "This is a prototype heuristic, not an official municipal optimization model.",
      "Items with unknown cost or unknown priority score cannot be auto-funded.",
      "Greedy density selection is not guaranteed to find the globally optimal set.",
      "Critical safety hazards are always listed for immediate review even when unfunded.",
    ],
    availableBudget: budget,
    eligibleRepairCost,
    unknownCostCount: ineligibleUnknownCost.length,
    recommended,
    recommendedSpend,
    remainingBudget: round2(remaining),
    unfundedHighPriority,
    unfundedCritical,
    mustReviewCritical: critical,
    ineligibleUnknownCost,
    ineligibleUnknownScore,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
