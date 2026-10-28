import assert from "node:assert/strict"
import { calculatePriorityScore, DEFAULT_WEIGHTS, validateWeights } from "./priority.js"
import { recommendBudgetAllocation } from "./budget.js"
import { assertTransition, canTransition } from "./workflow.js"
import { calculatePerformanceMetrics } from "./performance.js"
import { findRecurrenceCandidates } from "./recurrence.js"

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ PASS: ${name}`)
    passed++
  } catch (error: any) {
    console.error(`✗ FAIL: ${name}`)
    console.error(`  ${error.message}`)
    failed++
  }
}

test("priority score uses configured weights on complete inputs", () => {
  const result = calculatePriorityScore(
    {
      safetyRiskScore: 100,
      severity: "critical",
      affectedPopulation: 5000,
      recurrenceCount: 5,
      roadImportanceScore: 100,
    },
    DEFAULT_WEIGHTS,
  )
  assert.equal(result.score, 100)
  assert.equal(result.scoreIncomplete, false)
})

test("missing factors are not treated as zero and mark the score incomplete", () => {
  const result = calculatePriorityScore({
    safetyRiskScore: 80,
    severity: "high",
    affectedPopulation: null,
    recurrenceCount: undefined,
    roadImportanceScore: null,
  })
  assert.equal(result.scoreIncomplete, true)
  assert.ok(result.missingFactors.includes("affectedPopulation"))
  assert.ok(result.missingFactors.includes("recurrence"))
  assert.ok(result.missingFactors.includes("roadImportance"))
  assert.ok(result.score !== null && result.score > 0)
  const population = result.factors.find((f) => f.key === "affectedPopulation")
  assert.equal(population?.contribution, null)
})

test("invalid weights are rejected", () => {
  const check = validateWeights({ ...DEFAULT_WEIGHTS, safetyRisk: 0.9 })
  assert.equal(check.ok, false)
})

test("budget optimizer funds density but never hides unfunded critical hazards", () => {
  const result = recommendBudgetAllocation(
    [
      {
        id: "cheap",
        title: "Cheap cosmetic",
        priorityScore: 40,
        scoreIncomplete: false,
        estimatedCost: 10000,
        safetyRiskScore: 20,
        severity: "low",
      },
      {
        id: "critical",
        title: "Live leak",
        priorityScore: 90,
        scoreIncomplete: false,
        estimatedCost: 200000,
        safetyRiskScore: 95,
        severity: "critical",
      },
      {
        id: "mid",
        title: "Pothole",
        priorityScore: 70,
        scoreIncomplete: false,
        estimatedCost: 30000,
        safetyRiskScore: 50,
        severity: "high",
      },
    ],
    40000,
  )
  assert.ok(result.mustReviewCritical.some((i) => i.id === "critical"))
  assert.ok(result.unfundedCritical.some((i) => i.id === "critical"))
  assert.ok(result.recommended.every((i) => i.id !== "critical" || (i.estimatedCost || 0) <= 40000))
  assert.ok(result.recommendedSpend <= 40000)
  assert.ok(result.remainingBudget >= 0)
})

test("unknown cost items cannot be auto-funded", () => {
  const result = recommendBudgetAllocation(
    [
      {
        id: "unknown",
        title: "No estimate",
        priorityScore: 99,
        scoreIncomplete: false,
        estimatedCost: null,
        safetyRiskScore: 40,
        severity: "high",
      },
    ],
    100000,
  )
  assert.equal(result.recommended.length, 0)
  assert.equal(result.ineligibleUnknownCost.length, 1)
})

test("negative budget is rejected", () => {
  assert.throws(() => recommendBudgetAllocation([], -1))
})

test("work-order transitions enforce lifecycle", () => {
  assert.equal(canTransition("created", "assigned"), true)
  assert.equal(canTransition("created", "verified"), false)
  assert.equal(canTransition("completed", "verified"), true)
  assert.equal(canTransition("in_progress", "verified"), false)
  assert.throws(() => assertTransition("assigned", "verified"))
})

test("SLA and on-time metrics exclude missing dates", () => {
  const metrics = calculatePerformanceMetrics([
    {
      id: "a",
      status: "verified",
      createdAt: "2026-01-01T00:00:00.000Z",
      startDate: "2026-01-01T01:00:00.000Z",
      dueDate: "2026-01-02T00:00:00.000Z",
      completionDate: "2026-01-01T10:00:00.000Z",
      slaHours: 24,
    },
    {
      id: "b",
      status: "verified",
      createdAt: "2026-01-01T00:00:00.000Z",
      completionDate: "2026-01-03T00:00:00.000Z",
    },
    {
      id: "c",
      status: "in_progress",
    },
  ])
  assert.equal(metrics.onTimeDenominator, 1)
  assert.equal(metrics.onTimeCompletionRate, 100)
  assert.equal(metrics.slaDenominator, 1)
  assert.equal(metrics.verifiedCompletionRate, 100)
  assert.ok(metrics.insufficientData.length >= 0)
})

test("repeat-failure rate uses confirmed recurrences only", () => {
  const metrics = calculatePerformanceMetrics([
    { id: "wo1", status: "verified", confirmedRecurrence: true },
    { id: "wo2", status: "verified", confirmedRecurrence: false },
    { id: "wo3", status: "completed", confirmedRecurrence: true },
  ])
  assert.equal(metrics.repeatFailureDenominator, 2)
  assert.equal(metrics.repeatFailureRate, 50)
})

test("recurrence candidates require proximity, category, and later date", () => {
  const current = {
    id: "new",
    lat: 13.0382,
    lng: 80.2497,
    category: "road",
    submittedAt: "2026-08-20T00:00:00.000Z",
    status: "submitted",
  }
  const previous = [
    {
      id: "old-same",
      lat: 13.0383,
      lng: 80.2497,
      category: "road",
      submittedAt: "2026-08-01T00:00:00.000Z",
      status: "resolved",
      resolvedAt: "2026-08-05T00:00:00.000Z",
    },
    {
      id: "old-other-cat",
      lat: 13.0383,
      lng: 80.2497,
      category: "garbage",
      submittedAt: "2026-08-01T00:00:00.000Z",
      status: "resolved",
    },
    {
      id: "far",
      lat: 12.0,
      lng: 80.0,
      category: "road",
      submittedAt: "2026-08-01T00:00:00.000Z",
      status: "resolved",
    },
  ]
  const candidates = findRecurrenceCandidates(current, previous)
  assert.equal(candidates.length, 1)
  assert.equal(candidates[0].previousIssueId, "old-same")
})

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
