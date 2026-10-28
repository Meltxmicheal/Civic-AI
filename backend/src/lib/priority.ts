export type PriorityWeights = {
  safetyRisk: number
  severity: number
  affectedPopulation: number
  recurrence: number
  roadImportance: number
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  safetyRisk: 0.3,
  severity: 0.25,
  affectedPopulation: 0.2,
  recurrence: 0.15,
  roadImportance: 0.1,
}

export const WEIGHT_DISCLAIMER =
  "These weights are initial demo settings, not officially validated municipal standards."

export type FactorKey = keyof PriorityWeights

export type FactorResult = {
  key: FactorKey
  label: string
  rawValue: number | null
  normalizedScore: number | null
  weight: number
  appliedWeight: number
  contribution: number | null
  missing: boolean
  source: string
}

export type PriorityScoreInput = {
  safetyRiskScore: number | null | undefined
  severity: string | null | undefined
  affectedPopulation: number | null | undefined
  recurrenceCount: number | null | undefined
  roadImportanceScore: number | null | undefined
  sources?: Partial<Record<FactorKey, string>>
}

export type PriorityScoreResult = {
  score: number | null
  scoreIncomplete: boolean
  missingFactors: FactorKey[]
  availableWeightSum: number
  factors: FactorResult[]
  explanation: string
  formula: string
  weights: PriorityWeights
  disclaimer: string
}

const SEVERITY_SCORE: Record<string, number> = {
  low: 25,
  medium: 50,
  high: 75,
  critical: 100,
}

export function clamp01to100(value: number): number {
  if (!Number.isFinite(value)) return NaN
  return Math.min(100, Math.max(0, value))
}

export function validateWeights(weights: PriorityWeights): { ok: boolean; error?: string } {
  const values = Object.values(weights)
  if (values.some((v) => typeof v !== "number" || !Number.isFinite(v) || v < 0)) {
    return { ok: false, error: "Weights must be non-negative finite numbers." }
  }
  const sum = values.reduce((a, b) => a + b, 0)
  if (Math.abs(sum - 1) > 0.0001) {
    return { ok: false, error: `Weights must sum to 1.0000 (got ${sum.toFixed(4)}).` }
  }
  return { ok: true }
}

export function normalizeSeverity(severity: string | null | undefined): number | null {
  if (!severity || typeof severity !== "string") return null
  const mapped = SEVERITY_SCORE[severity.toLowerCase().trim()]
  return mapped === undefined ? null : mapped
}

export function normalizeRecurrence(count: number | null | undefined): number | null {
  if (count === null || count === undefined) return null
  if (!Number.isFinite(count) || count < 0) return null
  return clamp01to100((count / 5) * 100)
}

export function normalizePopulation(population: number | null | undefined): number | null {
  if (population === null || population === undefined) return null
  if (!Number.isFinite(population) || population < 0) return null
  return clamp01to100((population / 5000) * 100)
}

export function isCriticalSafetyHazard(input: {
  safetyRiskScore?: number | null
  severity?: string | null
}): boolean {
  const safety = input.safetyRiskScore
  const criticalSafety = typeof safety === "number" && Number.isFinite(safety) && safety >= 80
  const criticalSeverity = (input.severity || "").toLowerCase() === "critical"
  return Boolean(criticalSafety || criticalSeverity)
}

function finiteOrNull(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value)) return null
  return value
}

export function calculatePriorityScore(
  input: PriorityScoreInput,
  weights: PriorityWeights = DEFAULT_WEIGHTS,
): PriorityScoreResult {
  const weightCheck = validateWeights(weights)
  if (!weightCheck.ok) {
    throw new Error(weightCheck.error)
  }

  const safety = finiteOrNull(input.safetyRiskScore)
  const safetyNorm = safety === null ? null : clamp01to100(safety)
  const severityNorm = normalizeSeverity(input.severity)
  const populationNorm = normalizePopulation(input.affectedPopulation)
  const recurrenceNorm = normalizeRecurrence(input.recurrenceCount)
  const roadNorm = finiteOrNull(input.roadImportanceScore)
  const roadNormalized = roadNorm === null ? null : clamp01to100(roadNorm)

  const source = (key: FactorKey, fallback: string) => input.sources?.[key] || fallback

  const draft: Omit<FactorResult, "appliedWeight" | "contribution">[] = [
    {
      key: "safetyRisk",
      label: "Safety risk",
      rawValue: safety,
      normalizedScore: safetyNorm,
      weight: weights.safetyRisk,
      missing: safetyNorm === null,
      source: source("safetyRisk", safetyNorm === null ? "unavailable" : "recorded"),
    },
    {
      key: "severity",
      label: "Issue severity",
      rawValue: severityNorm,
      normalizedScore: severityNorm,
      weight: weights.severity,
      missing: severityNorm === null,
      source: source("severity", severityNorm === null ? "unavailable" : "complaint.priority"),
    },
    {
      key: "affectedPopulation",
      label: "Affected population",
      rawValue: finiteOrNull(input.affectedPopulation),
      normalizedScore: populationNorm,
      weight: weights.affectedPopulation,
      missing: populationNorm === null,
      source: source("affectedPopulation", populationNorm === null ? "unavailable" : "recorded"),
    },
    {
      key: "recurrence",
      label: "Confirmed recurrence count",
      rawValue: finiteOrNull(input.recurrenceCount),
      normalizedScore: recurrenceNorm,
      weight: weights.recurrence,
      missing: recurrenceNorm === null,
      source: source("recurrence", recurrenceNorm === null ? "unavailable" : "confirmed-recurrence-records"),
    },
    {
      key: "roadImportance",
      label: "Road / infrastructure importance",
      rawValue: roadNorm,
      normalizedScore: roadNormalized,
      weight: weights.roadImportance,
      missing: roadNormalized === null,
      source: source("roadImportance", roadNormalized === null ? "unavailable" : "recorded"),
    },
  ]

  const availableWeightSum = draft
    .filter((f) => !f.missing)
    .reduce((sum, f) => sum + f.weight, 0)

  const factors: FactorResult[] = draft.map((f) => {
    if (f.missing || f.normalizedScore === null || availableWeightSum <= 0) {
      return { ...f, appliedWeight: 0, contribution: null }
    }
    const appliedWeight = f.weight / availableWeightSum
    return {
      ...f,
      appliedWeight,
      contribution: appliedWeight * f.normalizedScore,
    }
  })

  const missingFactors = factors.filter((f) => f.missing).map((f) => f.key)
  const scoreIncomplete = missingFactors.length > 0
  const contributions = factors.map((f) => f.contribution).filter((v): v is number => v !== null)
  const score = contributions.length === 0 ? null : round2(contributions.reduce((a, b) => a + b, 0))

  const parts = factors.map((f) => {
    if (f.missing) return `${f.label}: unavailable (not treated as zero)`
    return `${f.label}: ${f.normalizedScore}/100 × ${f.appliedWeight.toFixed(2)} = ${f.contribution?.toFixed(2)}`
  })

  const explanation =
    score === null
      ? "Priority score cannot be computed because every scoring factor is unavailable."
      : `Priority score ${score}/100. ${scoreIncomplete ? "Score is incomplete; missing factors were omitted and remaining weights were renormalized. " : ""}${parts.join(". ")}.`

  return {
    score,
    scoreIncomplete,
    missingFactors,
    availableWeightSum: round4(availableWeightSum),
    factors,
    explanation,
    formula:
      "Priority Score = renormalized sum of available factors: 0.30×Safety + 0.25×Severity + 0.20×Population + 0.15×Recurrence + 0.10×Road Importance (defaults).",
    weights,
    disclaimer: WEIGHT_DISCLAIMER,
  }
}

export function comparePriorityExplanations(
  a: { id: string; score: PriorityScoreResult; costEstimate: number | null; title: string },
  b: { id: string; score: PriorityScoreResult; costEstimate: number | null; title: string },
): string {
  const aScore = a.score.score
  const bScore = b.score.score
  if (aScore === null && bScore === null) {
    return `Both ${a.id} and ${b.id} lack enough recorded factors for a numeric ranking.`
  }
  if (aScore === null) return `${a.id} cannot be ranked because its score is unavailable.`
  if (bScore === null) return `${b.id} cannot be ranked because its score is unavailable.`

  const higher = aScore >= bScore ? a : b
  const lower = higher === a ? b : a
  const diffs = higher.score.factors
    .map((factor) => {
      const other = lower.score.factors.find((f) => f.key === factor.key)
      if (!other) return null
      if (factor.missing && other.missing) return `${factor.label}: unavailable on both`
      if (factor.missing) return `${factor.label}: unavailable on ${higher.id}`
      if (other.missing) return `${factor.label}: unavailable on ${lower.id}`
      const delta = (factor.normalizedScore || 0) - (other.normalizedScore || 0)
      return `${factor.label}: ${higher.id} ${delta >= 0 ? "higher" : "lower"} by ${Math.abs(delta).toFixed(1)} points`
    })
    .filter(Boolean)

  return `${higher.id} ranks above ${lower.id} (${higher.score.score} vs ${lower.score.score}) because: ${diffs.join("; ")}.`
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000
}
