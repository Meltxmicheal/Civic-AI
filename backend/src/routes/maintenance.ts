import { Router } from "express"
import { envelope, fail } from "../lib/persistence.js"
import { requireAuth, type AuthedRequest } from "../lib/auth.js"
import {
  calculatePriorityScore,
  comparePriorityExplanations,
  DEFAULT_WEIGHTS,
  validateWeights,
  type PriorityWeights,
} from "../lib/priority.js"
import { recommendBudgetAllocation } from "../lib/budget.js"
import { publicIssue, scoreIssue, toBudgetCandidate } from "../lib/issueScoring.js"
import { findIssueById, listAllIssues, patchIssueById } from "./issues.js"
import { getBudgetPlan, getWeights, listBudgetPlans, saveBudgetPlan, saveWeights, newId } from "../store/opsStore.js"
import { isCriticalSafetyHazard } from "../lib/priority.js"

export const maintenanceRouter = Router()

function parseWeights(body: any): PriorityWeights {
  return {
    safetyRisk: Number(body.safetyRisk ?? body.weights?.safetyRisk ?? DEFAULT_WEIGHTS.safetyRisk),
    severity: Number(body.severity ?? body.weights?.severity ?? DEFAULT_WEIGHTS.severity),
    affectedPopulation: Number(
      body.affectedPopulation ?? body.weights?.affectedPopulation ?? DEFAULT_WEIGHTS.affectedPopulation,
    ),
    recurrence: Number(body.recurrence ?? body.weights?.recurrence ?? DEFAULT_WEIGHTS.recurrence),
    roadImportance: Number(body.roadImportance ?? body.weights?.roadImportance ?? DEFAULT_WEIGHTS.roadImportance),
  }
}

async function scoredIssues(filters: Record<string, string | undefined>) {
  const weights = await getWeights()
  let issues = await listAllIssues()
  if (filters.department && filters.department !== "all") {
    issues = issues.filter(
      (i) => i.departmentId === filters.department || String(i.department || "").toLowerCase().includes(filters.department!.toLowerCase()),
    )
  }
  if (filters.ward && filters.ward !== "all") {
    issues = issues.filter((i) => String(i.ward || "") === filters.ward)
  }
  if (filters.severity && filters.severity !== "all") {
    issues = issues.filter((i) => i.priority === filters.severity)
  }
  if (filters.status && filters.status !== "all") {
    issues = issues.filter((i) => i.status === filters.status)
  }
  return issues.map((issue) => {
    const scored = scoreIssue(issue, weights)
    return {
      issue: publicIssue(issue),
      score: scored,
      criticalSafetyHazard: isCriticalSafetyHazard({
        safetyRiskScore: issue.safetyRiskScore,
        severity: issue.priority,
      }),
    }
  })
}

maintenanceRouter.get("/overview", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const rows = await scoredIssues(req.query as Record<string, string>)
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.issue.status))
  const critical = open.filter((r) => r.criticalSafetyHazard)
  const unknownCost = open.filter((r) => r.issue.costUnknown !== false && r.issue.costEstimate == null)
  const plans = await listBudgetPlans()
  const activePlan = plans[0]
  const recommendation = activePlan
    ? recommendBudgetAllocation(
        open.map((r) => toBudgetCandidate(r.issue, r.score)),
        activePlan.availableBudget,
      )
    : null

  res.json(
    envelope({
      data: {
        totals: {
          issues: rows.length,
          open: open.length,
          criticalSafetyOpen: critical.length,
          unknownCost: unknownCost.length,
        },
        activePlan: activePlan || null,
        recommendation,
        weights: await getWeights(),
        weightDisclaimer:
          "These weights are initial demo settings, not officially validated municipal standards.",
      },
    }),
  )
})

maintenanceRouter.get("/priorities", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const rows = await scoredIssues(req.query as Record<string, string>)
  rows.sort((a, b) => (b.score.score ?? -1) - (a.score.score ?? -1))
  res.json(envelope({ count: rows.length, data: rows }))
})

maintenanceRouter.post("/score", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  try {
    const weights = req.body?.weights ? parseWeights(req.body) : await getWeights()
    const check = validateWeights(weights)
    if (!check.ok) {
      res.status(400).json(fail(check.error || "Invalid weights"))
      return
    }
    if (req.body?.issueId) {
      const issue = await findIssueById(String(req.body.issueId))
      if (!issue) {
        res.status(404).json(fail("Issue not found"))
        return
      }
      const scored = scoreIssue(issue, weights)
      res.json(envelope({ data: { issue: publicIssue(issue), score: scored } }))
      return
    }
    const scored = calculatePriorityScore(req.body || {}, weights)
    res.json(envelope({ data: scored }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

maintenanceRouter.post("/compare", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const aId = String(req.body?.issueIdA || "")
  const bId = String(req.body?.issueIdB || "")
  if (!aId || !bId) {
    res.status(400).json(fail("issueIdA and issueIdB are required."))
    return
  }
  const weights = await getWeights()
  const issueA = await findIssueById(aId)
  const issueB = await findIssueById(bId)
  if (!issueA || !issueB) {
    res.status(404).json(fail("One or both issues were not found."))
    return
  }
  const scoreA = scoreIssue(issueA, weights)
  const scoreB = scoreIssue(issueB, weights)
  const ranking = comparePriorityExplanations(
    { id: issueA.id, title: issueA.title, score: scoreA, costEstimate: issueA.costEstimate ?? null },
    { id: issueB.id, title: issueB.title, score: scoreB, costEstimate: issueB.costEstimate ?? null },
  )
  res.json(
    envelope({
      data: {
        a: { issue: publicIssue(issueA), score: scoreA },
        b: { issue: publicIssue(issueB), score: scoreB },
        ranking,
      },
    }),
  )
})

maintenanceRouter.get("/weights", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  res.json(envelope({ data: await getWeights() }))
})

maintenanceRouter.put("/weights", requireAuth(["admin"]), async (req: AuthedRequest, res) => {
  try {
    const weights = parseWeights(req.body)
    const check = validateWeights(weights)
    if (!check.ok) {
      res.status(400).json(fail(check.error || "Invalid weights"))
      return
    }
    const saved = await saveWeights(weights, req.authUser?.email)
    res.json(envelope({ data: saved }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

maintenanceRouter.get("/budget-plans", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const plans = await listBudgetPlans()
  res.json(envelope({ count: plans.length, data: plans }))
})

maintenanceRouter.post("/budget-plans", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  try {
    const availableBudget = Number(req.body?.availableBudget)
    if (!Number.isFinite(availableBudget) || availableBudget < 0) {
      res.status(400).json(fail("availableBudget must be a non-negative number."))
      return
    }
    const plan = {
      id: req.body?.id || newId("BUD"),
      name: String(req.body?.name || "Maintenance budget plan"),
      department: req.body?.department || "all",
      ward: req.body?.ward || "all",
      periodStart: String(req.body?.periodStart || new Date().toISOString().slice(0, 10)),
      periodEnd: String(req.body?.periodEnd || new Date().toISOString().slice(0, 10)),
      availableBudget,
      notes: req.body?.notes || "",
      createdBy: req.authUser?.email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await saveBudgetPlan(plan)
    res.status(201).json(envelope({ data: plan }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

maintenanceRouter.get("/budget-plans/:id", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const plan = await getBudgetPlan(String(req.params.id))
  if (!plan) {
    res.status(404).json(fail("Budget plan not found."))
    return
  }
  const rows = await scoredIssues({
    department: plan.department === "all" ? undefined : plan.department,
    ward: plan.ward === "all" ? undefined : plan.ward,
  })
  const open = rows.filter((r) => !["resolved", "closed"].includes(r.issue.status))
  const recommendation = recommendBudgetAllocation(
    open.map((r) => toBudgetCandidate(r.issue, r.score)),
    plan.availableBudget,
  )
  res.json(envelope({ data: { plan, recommendation } }))
})

maintenanceRouter.patch("/issues/:id", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  const allowed = [
    "costEstimate",
    "costEstimateSource",
    "costUnknown",
    "safetyRiskScore",
    "safetyRiskSource",
    "affectedPopulation",
    "affectedPopulationSource",
    "roadImportanceScore",
    "roadImportanceSource",
    "budgetPlanningStatus",
    "departmentId",
  ]
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (req.body?.[key] !== undefined) patch[key] = req.body[key]
  }
  if (patch.costEstimate !== undefined) {
    const cost = Number(patch.costEstimate)
    if (!Number.isFinite(cost) || cost < 0) {
      res.status(400).json(fail("costEstimate must be a non-negative number."))
      return
    }
    patch.costEstimate = cost
    patch.costUnknown = false
    if (!patch.costEstimateSource) patch.costEstimateSource = `official:${req.authUser?.email}`
  }
  for (const numeric of ["safetyRiskScore", "affectedPopulation", "roadImportanceScore"] as const) {
    if (patch[numeric] !== undefined && patch[numeric] !== null) {
      const value = Number(patch[numeric])
      if (!Number.isFinite(value) || value < 0) {
        res.status(400).json(fail(`${numeric} must be a non-negative number or null.`))
        return
      }
      patch[numeric] = value
    }
  }
  const updated = await patchIssueById(String(req.params.id), patch)
  if (!updated) {
    res.status(404).json(fail("Issue not found."))
    return
  }
  const scored = scoreIssue(updated, await getWeights())
  await patchIssueById(String(req.params.id), {
    priorityScore: scored.score,
    priorityScoreIncomplete: scored.scoreIncomplete,
    priorityExplanation: scored.explanation,
  })
  res.json(envelope({ data: { issue: publicIssue(updated), score: scored } }))
})
