import { Router } from "express"
import { envelope, fail } from "../lib/persistence.js"
import { requireAuth } from "../lib/auth.js"
import { aggregateAreas, aggregateTrends } from "../lib/intelligence.js"
import { findRecurrenceCandidates } from "../lib/recurrence.js"
import { isCriticalSafetyHazard } from "../lib/priority.js"
import { listAllIssues } from "./issues.js"
import { listIntegrations, listReadings, listRecurrences, listWorkOrders } from "../store/opsStore.js"
import { publicIssue, scoreIssue } from "../lib/issueScoring.js"
import { getWeights } from "../store/opsStore.js"

export const intelligenceRouter = Router()

intelligenceRouter.get("/trends", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const issues = await listAllIssues()
  const recurrences = await listRecurrences()
  const confirmed = new Set(recurrences.filter((r) => r.status === "confirmed").map((r) => r.currentIssueId))
  const trends = aggregateTrends(issues, confirmed)
  res.json(envelope({ data: trends }))
})

intelligenceRouter.get("/areas", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const issues = await listAllIssues()
  const weights = await getWeights()
  const areas = aggregateAreas(issues)
  const unresolvedHigh = issues
    .filter((i) => i.status !== "resolved" && i.status !== "closed")
    .map((issue) => ({ issue: publicIssue(issue), score: scoreIssue(issue, weights) }))
    .filter(
      (row) =>
        (row.score.score || 0) >= 70 ||
        isCriticalSafetyHazard({ safetyRiskScore: row.issue.safetyRiskScore, severity: row.issue.priority }),
    )
  const recurrences = await listRecurrences()
  const confirmed = recurrences.filter((r) => r.status === "confirmed")
  res.json(
    envelope({
      data: {
        ...areas,
        unresolvedHighPriority: unresolvedHigh,
        recurringProblemAreas: confirmed,
        simulatedZones: false,
      },
    }),
  )
})

intelligenceRouter.get("/recurrence-scan", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const issues = await listAllIssues()
  const workOrders = await listWorkOrders()
  const existing = await listRecurrences()
  const scans = []
  for (const issue of issues) {
    const candidates = findRecurrenceCandidates(issue, issues)
    for (const candidate of candidates) {
      const already = existing.find(
        (r) => r.currentIssueId === issue.id && r.previousIssueId === candidate.previousIssueId,
      )
      scans.push({
        currentIssueId: issue.id,
        currentTitle: issue.title,
        ...candidate,
        previousWorkOrder: workOrders.find((w) => w.complaintId === candidate.previousIssueId) || null,
        reviewStatus: already?.status || "candidate",
        reviewId: already?.id || null,
      })
    }
  }
  res.json(
    envelope({
      data: scans,
      rule: "Location + category + time window only. Nearby complaints are not assumed to be the same problem.",
    }),
  )
})

intelligenceRouter.get("/integrations", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const integrations = await listIntegrations()
  res.json(envelope({ data: integrations }))
})

intelligenceRouter.get("/integrations/:id/status", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const integrations = await listIntegrations()
  const item = integrations.find((i) => i.id === req.params.id)
  if (!item) {
    res.status(404).json(fail("Integration not found."))
    return
  }
  const readings = (await listReadings()).filter((r) => r.integrationId === item.id)
  res.json(
    envelope({
      data: {
        ...item,
        recentReadings: readings,
      },
    }),
  )
})

intelligenceRouter.get("/simulated-feeds", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  const readings = await listReadings()
  res.json(
    envelope({
      data: readings,
      notice: "All records in this feed are simulated. Source and timestamp are included on each row.",
    }),
  )
})
