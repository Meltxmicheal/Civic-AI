import { Router } from "express"
import { envelope, fail } from "../lib/persistence.js"
import { requireAuth, type AuthedRequest } from "../lib/auth.js"
import { calculatePerformanceMetrics } from "../lib/performance.js"
import { listAllIssues } from "./issues.js"
import {
  contractorPasswordHash,
  getContractor,
  listContractors,
  listRecurrences,
  listWorkOrders,
  newId,
  saveContractor,
} from "../store/opsStore.js"

export const contractorsRouter = Router()

contractorsRouter.get("/", requireAuth(["admin", "department", "officer"]), async (_req, res) => {
  res.json(envelope({ data: await listContractors() }))
})

contractorsRouter.post("/", requireAuth(["admin", "department"]), async (req: AuthedRequest, res) => {
  const name = String(req.body?.name || "").trim()
  const email = String(req.body?.email || "").trim().toLowerCase()
  if (!name || !email) {
    res.status(400).json(fail("name and email are required."))
    return
  }
  const password = String(req.body?.password || "pass123")
  const doc = {
    id: newId("CON"),
    name,
    email,
    phone: req.body?.phone,
    department: req.body?.department,
    workTypes: Array.isArray(req.body?.workTypes) ? req.body.workTypes : [],
    passwordHash: contractorPasswordHash(password),
    active: true,
    notes: req.body?.notes || "Registered by municipal official.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await saveContractor(doc)
  const { passwordHash, ...publicDoc } = doc
  res.status(201).json(envelope({ data: publicDoc }))
})

contractorsRouter.get("/:id", requireAuth(["admin", "department", "officer", "contractor"]), async (req: AuthedRequest, res) => {
  const doc = await getContractor(String(req.params.id))
  if (!doc) {
    res.status(404).json(fail("Contractor not found."))
    return
  }
  if (req.authUser?.role === "contractor" && req.authUser.contractorId !== doc.id) {
    res.status(403).json(fail("Contractors may only view their own profile."))
    return
  }
  const { passwordHash, ...publicDoc } = doc
  res.json(envelope({ data: publicDoc }))
})

contractorsRouter.get("/:id/performance", requireAuth(["admin", "department", "officer"]), async (req, res) => {
  const doc = await getContractor(String(req.params.id))
  if (!doc) {
    res.status(404).json(fail("Contractor not found."))
    return
  }
  const workOrders = (await listWorkOrders()).filter((w) => w.contractorId === doc.id)
  const recurrences = await listRecurrences()
  const confirmed = new Set(
    recurrences.filter((r) => r.status === "confirmed").map((r) => r.previousWorkOrderId).filter(Boolean),
  )
  const issues = await listAllIssues()
  const metrics = calculatePerformanceMetrics(
    workOrders.map((w) => {
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
  const { passwordHash, ...publicDoc } = doc
  res.json(envelope({ data: { contractor: publicDoc, metrics, assignments: workOrders } }))
})
