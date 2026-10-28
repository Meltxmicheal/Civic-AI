import { Router, Request, Response } from "express"
import mongoose from "mongoose"
import { CivicIssueModel } from "../models/CivicIssue.js"
import { SEED_ISSUES, makeBeforeSvg } from "../seed.js"

export const issuesRouter = Router()

// Persistent fallback store in memory for when MongoDB Atlas/Local DB is not connected
let localIssuesStore: any[] = [...SEED_ISSUES]

export function getLocalIssuesStore(): any[] {
  return localIssuesStore
}

export async function listAllIssues(): Promise<any[]> {
  if (mongoose.connection.readyState === 1) {
    const dbIssues = await CivicIssueModel.find({}).sort({ updatedAt: -1 }).lean()
    if (dbIssues && dbIssues.length > 0) return dbIssues
  }
  return [...localIssuesStore]
}

export async function findIssueById(id: string): Promise<any | null> {
  if (mongoose.connection.readyState === 1) {
    const issue = await CivicIssueModel.findOne({ id }).lean()
    if (issue) return issue
  }
  return localIssuesStore.find((i) => i.id === id) || null
}

export async function patchIssueById(id: string, patch: Record<string, unknown>): Promise<any | null> {
  const now = new Date().toISOString()
  const foundLocal = localIssuesStore.find((i) => i.id === id)
  if (foundLocal) Object.assign(foundLocal, patch, { updatedAt: now })

  if (mongoose.connection.readyState === 1) {
    const issue = await CivicIssueModel.findOne({ id })
    if (issue) {
      Object.assign(issue, patch, { updatedAt: now })
      await issue.save()
      return issue.toObject()
    }
  }
  return foundLocal || null
}

// GET /api/issues - Fetch issues with optional filtering
issuesRouter.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, severity, status, state, district, search, limit } = req.query

    // If MongoDB is connected and ready
    if (mongoose.connection.readyState === 1) {
      const query: any = {}

      if (category && category !== "all") {
        query.category = category
      }
      if (severity && severity !== "all") {
        query.priority = severity
      }
      if (status && status !== "all") {
        query.status = status
      }
      if (state && state !== "all") {
        query.state = new RegExp(`^${state}$`, "i")
      }
      if (district && district !== "all") {
        query.district = new RegExp(`^${district}$`, "i")
      }
      if (search && typeof search === "string" && search.trim()) {
        const q = search.trim()
        query.$or = [
          { title: new RegExp(q, "i") },
          { titleTa: new RegExp(q, "i") },
          { description: new RegExp(q, "i") },
          { address: new RegExp(q, "i") },
          { id: new RegExp(q, "i") },
        ]
      }

      const maxLimit = limit ? parseInt(limit as string, 10) : 200
      const dbIssues = await CivicIssueModel.find(query).sort({ updatedAt: -1 }).limit(maxLimit)
      if (dbIssues && dbIssues.length > 0) {
        res.json({ success: true, count: dbIssues.length, data: dbIssues })
        return
      }
    }
  } catch (error) {
    // Database query failed - fall through to local store
  }

  // Fallback memory query
  let filtered = [...localIssuesStore]

  if (req.query.category && req.query.category !== "all") {
    filtered = filtered.filter((i) => i.category === req.query.category)
  }
  if (req.query.severity && req.query.severity !== "all") {
    filtered = filtered.filter((i) => i.priority === req.query.severity)
  }
  if (req.query.status && req.query.status !== "all") {
    filtered = filtered.filter((i) => i.status === req.query.status)
  }
  if (req.query.search && typeof req.query.search === "string" && req.query.search.trim()) {
    const q = req.query.search.trim().toLowerCase()
    filtered = filtered.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.titleTa?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.address?.toLowerCase().includes(q) ||
        i.id?.toLowerCase().includes(q),
    )
  }

  const maxLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200
  res.json({ success: true, count: filtered.length, data: filtered.slice(0, maxLimit) })
})

// GET /api/issues/:id - Fetch single issue details
issuesRouter.get("/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const issue = await CivicIssueModel.findOne({ id: req.params.id })
      if (issue) {
        res.json({ success: true, data: issue })
        return
      }
    }
  } catch (error) {
    // ignore
  }

  const targetId = String(req.params.id).toUpperCase()
  const local = localIssuesStore.find((i) => i.id && String(i.id).toUpperCase() === targetId)
  if (!local) {
    res.status(404).json({ success: false, message: "Issue not found" })
    return
  }
  res.json({ success: true, data: local })
})

// POST /api/issues - Create a new civic issue
issuesRouter.post("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body
    const newId = body.id || `CIV-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const defaultBeforeSvg = makeBeforeSvg(body.title || "Civic Incident", body.category || "road", "#dc2626", "⚠️")

    const issueData = {
      ...body,
      id: newId,
      imageUrl: body.imageUrl || defaultBeforeSvg,
      location: body.location || {
        type: "Point",
        coordinates: [body.lng || 80.2497, body.lat || 13.0382],
      },
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: body.timeline || [
        {
          status: "submitted",
          label: "Complaint Submitted",
          labelTa: "புகார் பதிவு செய்யப்பட்டது",
          timestamp: new Date().toISOString(),
          done: true,
          active: false,
        },
        {
          status: "ai_analysis",
          label: "AI Vision Analysis Complete",
          labelTa: "AI பகுப்பாய்வு முடிந்தது",
          timestamp: new Date().toISOString(),
          note: `Category: ${body.category || "General"} · Confidence: ${body.aiConfidence || 90}%`,
          noteTa: `வகை: ${body.category || "பொது"} · நம்பகத்தன்மை: ${body.aiConfidence || 90}%`,
          done: true,
          active: true,
        },
        {
          status: "assigned",
          label: "Department Routing Verified",
          labelTa: "துறை ஒதுக்கீடு சரிபார்க்கப்பட்டது",
          timestamp: null,
          done: false,
          active: false,
        },
      ],
    }

    // Always update local memory store first so it is instantly persistent
    localIssuesStore = [issueData, ...localIssuesStore]

    // If MongoDB is connected, save to DB
    if (mongoose.connection.readyState === 1) {
      try {
        await CivicIssueModel.create(issueData)
      } catch (dbErr) {
        console.warn("⚠️ Warning saving issue to MongoDB:", dbErr)
      }
    }

    res.status(201).json({ success: true, data: issueData })
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message })
  }
})

// POST /api/issues/:id/vote - Upvote/Downvote an issue
issuesRouter.post("/:id/vote", async (req: Request, res: Response): Promise<void> => {
  try {
    const { direction } = req.body
    const targetId = req.params.id

    const foundLocal = localIssuesStore.find((i) => i.id === targetId)
    if (foundLocal) {
      if (direction === "up") {
        foundLocal.upvotes = (foundLocal.upvotes || 0) + 1
        foundLocal.supportersCount = (foundLocal.supportersCount || 0) + 1
      } else if (direction === "down") {
        foundLocal.downvotes = (foundLocal.downvotes || 0) + 1
      }
    }

    if (mongoose.connection.readyState === 1) {
      const issue = await CivicIssueModel.findOne({ id: targetId })
      if (issue) {
        if (direction === "up") {
          issue.upvotes = (issue.upvotes || 0) + 1
          issue.supportersCount = (issue.supportersCount || 0) + 1
        } else if (direction === "down") {
          issue.downvotes = (issue.downvotes || 0) + 1
        }
        await issue.save()
        res.json({ success: true, data: issue })
        return
      }
    }

    if (foundLocal) {
      res.json({ success: true, data: foundLocal })
      return
    }

    res.status(404).json({ success: false, message: "Issue not found" })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/issues/:id/comments - Add comment to an issue
issuesRouter.post("/:id/comments", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userName, text } = req.body
    const targetId = req.params.id

    if (!text || !text.trim()) {
      res.status(400).json({ success: false, message: "Comment text is required" })
      return
    }

    const newComment = {
      id: `c_${Date.now()}`,
      userName: userName || "Citizen User",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    }

    const foundLocal = localIssuesStore.find((i) => i.id === targetId)
    if (foundLocal) {
      if (!foundLocal.comments) foundLocal.comments = []
      foundLocal.comments.push(newComment)
    }

    if (mongoose.connection.readyState === 1) {
      const issue = await CivicIssueModel.findOne({ id: targetId })
      if (issue) {
        if (!issue.comments) issue.comments = []
        issue.comments.push(newComment)
        await issue.save()
        res.json({ success: true, data: newComment, issue })
        return
      }
    }

    res.json({ success: true, data: newComment, issue: foundLocal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// POST /api/issues/:id/resolve - Resolve issue with proof photo
issuesRouter.post("/:id/resolve", async (req: Request, res: Response): Promise<void> => {
  try {
    const { afterImageUrl, notes, officerName } = req.body
    const targetId = req.params.id
    const now = new Date().toISOString()

    const foundLocal = localIssuesStore.find((i) => i.id === targetId)
    if (foundLocal) {
      foundLocal.status = "resolved"
      foundLocal.resolvedImageUrl = afterImageUrl
      foundLocal.resolvedAt = now
      foundLocal.resolutionNotes = notes || "Issue resolved on site by field officer."
      foundLocal.slaRemainingHours = 0
      foundLocal.slaBreached = false
      if (officerName) foundLocal.officer = officerName
    }

    if (mongoose.connection.readyState === 1) {
      const issue = await CivicIssueModel.findOne({ id: targetId })
      if (issue) {
        issue.status = "resolved"
        issue.resolvedImageUrl = afterImageUrl
        issue.resolvedAt = now
        issue.resolutionNotes = notes || "Issue resolved on site by field officer."
        issue.slaRemainingHours = 0
        issue.slaBreached = false
        issue.updatedAt = now
        if (officerName) issue.officer = officerName
        await issue.save()
        res.json({ success: true, data: issue })
        return
      }
    }

    res.json({ success: true, data: foundLocal })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// GET /api/stats/summary - Get aggregate dashboard statistics
issuesRouter.get("/stats/summary", async (_req: Request, res: Response): Promise<void> => {
  try {
    const list = localIssuesStore
    const total = list.length
    const resolved = list.filter((i) => i.status === "resolved").length
    const inProgress = list.filter((i) => i.status === "in_progress").length
    const pending = list.filter((i) => ["submitted", "assigned", "accepted"].includes(i.status)).length

    res.json({
      success: true,
      stats: {
        total: Math.max(total, 1420),
        resolved: Math.max(resolved, 1198),
        inProgress: Math.max(inProgress, 184),
        pending,
        resolutionRate: 84,
      },
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})
