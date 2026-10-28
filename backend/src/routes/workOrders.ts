import { Router } from "express"
import { envelope, fail } from "../lib/persistence.js"
import { requireAuth, type AuthedRequest } from "../lib/auth.js"
import {
  assertRole,
  assertTransition,
  complaintStatusForWorkOrder,
  type WorkOrderStatus,
} from "../lib/workflow.js"
import { findRecurrenceCandidates } from "../lib/recurrence.js"
import { calculatePerformanceMetrics } from "../lib/performance.js"
import { findIssueById, listAllIssues, patchIssueById } from "./issues.js"
import {
  getContractor,
  getWorkOrder,
  listRecurrences,
  listWorkOrders,
  newId,
  saveRecurrence,
  saveWorkOrder,
} from "../store/opsStore.js"
import { scoreIssue } from "../lib/issueScoring.js"
import { getWeights } from "../store/opsStore.js"

export const workOrdersRouter = Router()

function sanitizeWorkOrder(doc: any) {
  return doc
}

workOrdersRouter.get("/", requireAuth(["admin", "department", "officer", "contractor"]), async (req: AuthedRequest, res) => {
  let rows = await listWorkOrders()
  if (req.authUser?.role === "contractor" && req.authUser.contractorId) {
    rows = rows.filter((w) => w.contractorId === req.authUser?.contractorId)
  }
  const { status, department, contractorId, complaintId } = req.query
  if (status && status !== "all") rows = rows.filter((w) => w.status === status)
  if (department && department !== "all") rows = rows.filter((w) => w.department === department)
  if (contractorId) rows = rows.filter((w) => w.contractorId === contractorId)
  if (complaintId) rows = rows.filter((w) => w.complaintId === complaintId)
  res.json(envelope({ count: rows.length, data: rows.map(sanitizeWorkOrder) }))
})

workOrdersRouter.get("/reports/performance", requireAuth(["admin", "department"]), async (req, res) => {
  const contractorId = req.query.contractorId ? String(req.query.contractorId) : undefined
  const department = req.query.department ? String(req.query.department) : undefined
  let rows = await listWorkOrders()
  if (contractorId) rows = rows.filter((w) => w.contractorId === contractorId)
  if (department && department !== "all") rows = rows.filter((w) => w.department === department)
  const recurrences = await listRecurrences()
  const confirmed = new Set(
    recurrences.filter((r) => r.status === "confirmed").map((r) => r.previousWorkOrderId).filter(Boolean),
  )
  const issues = await listAllIssues()
  const metrics = calculatePerformanceMetrics(
    rows.map((w) => {
      const issue = issues.find((i) => i.id === w.complaintId)
      return {
        id: w.id,
        contractorId: w.contractorId,
        department: w.department,
        category: w.category,
        status: w.status,
        createdAt: w.createdAt,
        assignedAt: w.assignedAt,
        startDate: w.startDate,
        dueDate: w.dueDate,
        completionDate: w.completionDate,
        slaHours: w.slaHours,
        estimatedCost: w.estimatedCost,
        approvedCost: w.approvedCost,
        confirmedRecurrence: confirmed.has(w.id),
        citizenUpvotes: issue?.upvotes ?? null,
        citizenDownvotes: issue?.downvotes ?? null,
      }
    }),
  )
  res.json(envelope({ data: { metrics, workOrders: rows.length } }))
})

workOrdersRouter.post("/", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  try {
    const complaintId = String(req.body?.complaintId || "")
    if (!complaintId) {
      res.status(400).json(fail("complaintId is required."))
      return
    }
    const issue = await findIssueById(complaintId)
    if (!issue) {
      res.status(404).json(fail("Linked complaint not found."))
      return
    }
    if (req.body?.estimatedCost != null) {
      const cost = Number(req.body.estimatedCost)
      if (!Number.isFinite(cost) || cost < 0) {
        res.status(400).json(fail("estimatedCost must be a non-negative number."))
        return
      }
    }
    const weights = await getWeights()
    const scored = scoreIssue(issue, weights)
    const now = new Date().toISOString()
    const doc = {
      id: newId("WO"),
      complaintId: issue.id,
      department: issue.department,
      location: issue.address,
      ward: issue.ward,
      zone: issue.zone,
      lat: issue.lat,
      lng: issue.lng,
      workDescription: String(req.body?.workDescription || issue.title),
      priorityScore: scored.score,
      contractorId: null,
      contractorName: null,
      estimatedCost: req.body?.estimatedCost ?? issue.costEstimate ?? null,
      approvedCost: null,
      createdAt: now,
      assignedAt: null,
      startDate: null,
      dueDate: req.body?.dueDate || null,
      completionDate: null,
      status: "created" as WorkOrderStatus,
      beforeImageUrl: issue.imageUrl || null,
      afterImageUrl: null,
      repairNotes: null,
      verificationStatus: "unverified",
      verifyingOfficial: null,
      verifiedAt: null,
      slaHours: issue.slaHours ?? null,
      category: issue.category,
      audit: [
        {
          at: now,
          actor: req.authUser?.email,
          role: req.authUser?.role,
          action: "create",
          toStatus: "created",
        },
      ],
      updatedAt: now,
    }
    await saveWorkOrder(doc)
    res.status(201).json(envelope({ data: doc }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

workOrdersRouter.get("/:id", requireAuth(["admin", "department", "officer", "contractor"]), async (req: AuthedRequest, res) => {
  const doc = await getWorkOrder(String(req.params.id))
  if (!doc) {
    res.status(404).json(fail("Work order not found."))
    return
  }
  if (req.authUser?.role === "contractor" && doc.contractorId !== req.authUser.contractorId) {
    res.status(403).json(fail("Contractors may only view assigned work orders."))
    return
  }
  const issue = await findIssueById(doc.complaintId)
  res.json(envelope({ data: { ...doc, complaint: issue ? { id: issue.id, title: issue.title, status: issue.status } : null } }))
})

workOrdersRouter.patch("/:id/assign", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  try {
    const doc = await getWorkOrder(String(req.params.id))
    if (!doc) {
      res.status(404).json(fail("Work order not found."))
      return
    }
    assertRole("assign", req.authUser!.role)
    const contractor = await getContractor(String(req.body?.contractorId || ""))
    if (!contractor) {
      res.status(404).json(fail("Contractor not found."))
      return
    }
    const from = doc.status as WorkOrderStatus
    const to: WorkOrderStatus = "assigned"
    if (from !== "assigned") assertTransition(from === "created" ? "created" : from, to)
    const now = new Date().toISOString()
    doc.contractorId = contractor.id
    doc.contractorName = contractor.name
    doc.assignedAt = now
    doc.status = to
    doc.audit = [
      ...(doc.audit || []),
      {
        at: now,
        actor: req.authUser?.email,
        role: req.authUser?.role,
        action: "assign",
        fromStatus: from,
        toStatus: to,
        note: `Assigned to ${contractor.name}${from === "assigned" ? " (reassignment)" : ""}`,
      },
    ]
    doc.updatedAt = now
    await saveWorkOrder(doc)
    const mapped = complaintStatusForWorkOrder(to)
    if (mapped) await patchIssueById(doc.complaintId, { status: mapped, officer: contractor.name })
    res.json(envelope({ data: doc }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

workOrdersRouter.patch("/:id/status", requireAuth(["admin", "department", "officer", "contractor"]), async (req: AuthedRequest, res) => {
  try {
    const doc = await getWorkOrder(String(req.params.id))
    if (!doc) {
      res.status(404).json(fail("Work order not found."))
      return
    }
    if (req.authUser?.role === "contractor" && doc.contractorId !== req.authUser.contractorId) {
      res.status(403).json(fail("Contractors may only update assigned work orders."))
      return
    }
    const to = String(req.body?.status || "") as WorkOrderStatus
    const from = doc.status as WorkOrderStatus
    assertTransition(from, to)
    const now = new Date().toISOString()
    if (to === "accepted") assertRole("accept", req.authUser!.role)
    if (to === "in_progress") {
      assertRole("start", req.authUser!.role)
      doc.startDate = doc.startDate || now
    }
    if (to === "completed") {
      assertRole("complete", req.authUser!.role)
      doc.completionDate = now
      if (req.body?.repairNotes) doc.repairNotes = String(req.body.repairNotes)
    }
    if (to === "rejected") assertRole("reject", req.authUser!.role)
    if (to === "reopened") {
      assertRole("reopen", req.authUser!.role)
      doc.verificationStatus = "unverified"
      doc.completionDate = null
    }
    if (to === "verified") {
      res.status(400).json(fail("Use POST /verify. Photograph upload does not verify work."))
      return
    }
    doc.status = to
    doc.audit = [
      ...(doc.audit || []),
      {
        at: now,
        actor: req.authUser?.email,
        role: req.authUser?.role,
        action: "status",
        fromStatus: from,
        toStatus: to,
        note: req.body?.note,
      },
    ]
    doc.updatedAt = now
    await saveWorkOrder(doc)
    const mapped = complaintStatusForWorkOrder(to)
    if (mapped) await patchIssueById(doc.complaintId, { status: mapped })
    res.json(envelope({ data: doc }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

workOrdersRouter.post("/:id/evidence", requireAuth(["admin", "department", "officer", "contractor"]), async (req: AuthedRequest, res) => {
  try {
    const doc = await getWorkOrder(String(req.params.id))
    if (!doc) {
      res.status(404).json(fail("Work order not found."))
      return
    }
    if (req.authUser?.role === "contractor" && doc.contractorId !== req.authUser.contractorId) {
      res.status(403).json(fail("Contractors may only update assigned work orders."))
      return
    }
    assertRole("evidence", req.authUser!.role)
    if (req.body?.beforeImageUrl) doc.beforeImageUrl = String(req.body.beforeImageUrl)
    if (req.body?.afterImageUrl) doc.afterImageUrl = String(req.body.afterImageUrl)
    if (req.body?.repairNotes) doc.repairNotes = String(req.body.repairNotes)
    doc.audit = [
      ...(doc.audit || []),
      {
        at: new Date().toISOString(),
        actor: req.authUser?.email,
        role: req.authUser?.role,
        action: "evidence",
        note: "Evidence recorded. Verification still required from an authorized official.",
      },
    ]
    doc.updatedAt = new Date().toISOString()
    await saveWorkOrder(doc)
    res.json(
      envelope({
        data: doc,
        notice: "Evidence stored. Status is not verified until an official completes verification.",
      }),
    )
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

workOrdersRouter.post("/:id/verify", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  try {
    const doc = await getWorkOrder(String(req.params.id))
    if (!doc) {
      res.status(404).json(fail("Work order not found."))
      return
    }
    assertRole("verify", req.authUser!.role)
    const decision = String(req.body?.decision || "verified")
    const from = doc.status as WorkOrderStatus
    const now = new Date().toISOString()
    if (decision === "rejected") {
      assertTransition(from, "reopened")
      doc.status = "reopened"
      doc.verificationStatus = "rejected"
      doc.verifyingOfficial = req.authUser?.email
      doc.verifiedAt = now
    } else {
      assertTransition(from, "verified")
      doc.status = "verified"
      doc.verificationStatus = "verified"
      doc.verifyingOfficial = req.authUser?.email
      doc.verifiedAt = now
      if (req.body?.approvedCost != null) {
        const cost = Number(req.body.approvedCost)
        if (!Number.isFinite(cost) || cost < 0) {
          res.status(400).json(fail("approvedCost must be a non-negative number."))
          return
        }
        doc.approvedCost = cost
      }
      await patchIssueById(doc.complaintId, {
        status: "resolved",
        resolvedAt: now,
        resolvedImageUrl: doc.afterImageUrl || undefined,
        resolutionNotes: doc.repairNotes || "Verified by municipal official.",
        officer: doc.contractorName,
      })
    }
    doc.audit = [
      ...(doc.audit || []),
      {
        at: now,
        actor: req.authUser?.email,
        role: req.authUser?.role,
        action: "verify",
        fromStatus: from,
        toStatus: doc.status,
        note: req.body?.note,
      },
    ]
    doc.updatedAt = now
    await saveWorkOrder(doc)
    res.json(envelope({ data: doc }))
  } catch (error: any) {
    res.status(400).json(fail(error.message))
  }
})

workOrdersRouter.get("/:id/recurrence-candidates", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const doc = await getWorkOrder(String(req.params.id))
  if (!doc) {
    res.status(404).json(fail("Work order not found."))
    return
  }
  const issue = await findIssueById(doc.complaintId)
  if (!issue) {
    res.status(404).json(fail("Linked complaint not found."))
    return
  }
  const all = await listAllIssues()
  const candidates = findRecurrenceCandidates(issue, all)
  const workOrders = await listWorkOrders()
  const data = candidates.map((c) => ({
    ...c,
    previousWorkOrder: workOrders.find((w) => w.complaintId === c.previousIssueId) || null,
  }))
  res.json(
    envelope({
      data,
      rule: "Candidates are nearby same-category complaints within 75m and 180 days. They are not counted as recurrences until confirmed.",
    }),
  )
})

workOrdersRouter.post("/recurrence/:id/review", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  const decision = String(req.body?.status || "")
  if (!["confirmed", "rejected"].includes(decision)) {
    res.status(400).json(fail("status must be confirmed or rejected."))
    return
  }
  const reviews = await listRecurrences()
  let review = reviews.find((r) => r.id === req.params.id)
  if (!review) {
    review = {
      id: String(req.params.id),
      currentIssueId: String(req.body?.currentIssueId || ""),
      previousIssueId: String(req.body?.previousIssueId || ""),
      previousWorkOrderId: req.body?.previousWorkOrderId || null,
      distanceMeters: Number(req.body?.distanceMeters || 0),
      status: "candidate",
      createdAt: new Date().toISOString(),
    }
  }
  review.status = decision
  review.reviewedBy = req.authUser?.email
  review.reviewedAt = new Date().toISOString()
  review.note = req.body?.note
  await saveRecurrence(review)
  if (decision === "confirmed" && review.currentIssueId) {
    const issue = await findIssueById(review.currentIssueId)
    const nextCount = (issue?.recurrenceCount || 0) + 1
    await patchIssueById(review.currentIssueId, { recurrenceCount: nextCount })
  }
  res.json(envelope({ data: review }))
})
