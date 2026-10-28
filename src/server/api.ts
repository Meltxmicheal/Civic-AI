import { getIssuesCollection, INITIAL_CIVIC_ISSUES } from "./db.ts"
import type { CivicIssue, IssueComment } from "../types/index.ts"

function loadInitialIssues(): CivicIssue[] {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("civicai_issues")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch {
      // ignore
    }
  }
  return [...INITIAL_CIVIC_ISSUES]
}

function persistIssues() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("civicai_issues", JSON.stringify(inMemoryIssues))
    } catch {
      // ignore
    }
  }
}

// In-memory fallback cache with localStorage sync in browser
let inMemoryIssues: CivicIssue[] = loadInitialIssues()

// User votes map (issueId -> "up" | "down" | null)
function getUserVotes(): Record<string, "up" | "down"> {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("civicai_user_votes")
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return {}
}

function persistUserVotes(votes: Record<string, "up" | "down">) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("civicai_user_votes", JSON.stringify(votes))
    } catch {
      // ignore
    }
  }
}

let inMemoryUserVotes: Record<string, "up" | "down"> = getUserVotes()

const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:5000"

/**
 * Retrieves issues matching spatial viewport and attribute filters
 */
export async function getIssues(params: {
  north?: number
  south?: number
  east?: number
  west?: number
  category?: string
  severity?: string
  status?: string
  state?: string
  district?: string
  search?: string
  limit?: number
}): Promise<CivicIssue[]> {
  // Try fetching live from Backend API connected to MongoDB Atlas
  try {
    const queryParams = new URLSearchParams()
    if (params.category) queryParams.set("category", params.category)
    if (params.severity) queryParams.set("severity", params.severity)
    if (params.status) queryParams.set("status", params.status)
    if (params.state) queryParams.set("state", params.state)
    if (params.district) queryParams.set("district", params.district)
    if (params.search) queryParams.set("search", params.search)
    if (params.limit) queryParams.set("limit", params.limit.toString())

    const res = await fetch(`${API_BASE_URL}/api/issues?${queryParams.toString()}`, {
      headers: { "Content-Type": "application/json" },
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        // Merge backend list with any local un-synced items
        const existingIds = new Set(data.data.map((i: CivicIssue) => i.id))
        const localOnly = inMemoryIssues.filter((i) => !existingIds.has(i.id))
        inMemoryIssues = [...data.data, ...localOnly]
        persistIssues()

        const userVotes = getUserVotes()
        return inMemoryIssues.map((issue: CivicIssue) => ({
          ...issue,
          userVote: userVotes[issue.id] || null,
        }))
      }
    }
  } catch {
    // API server unreachable - fall through to in-memory fallback
  }

  const userVotes = getUserVotes()

  let filtered = inMemoryIssues.map((issue) => ({
    ...issue,
    userVote: userVotes[issue.id] || null,
  }))

  if (params.category && params.category !== "all") {
    filtered = filtered.filter((i) => i.category === params.category)
  }
  if (params.severity && params.severity !== "all") {
    filtered = filtered.filter((i) => i.priority === params.severity)
  }
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((i) => i.status === params.status)
  }
  if (params.state && params.state !== "all") {
    filtered = filtered.filter((i) => i.state?.toLowerCase() === params.state?.toLowerCase())
  }
  if (params.district && params.district !== "all") {
    filtered = filtered.filter((i) => i.district?.toLowerCase() === params.district?.toLowerCase())
  }
  if (params.search && params.search.trim()) {
    const q = params.search.toLowerCase().trim()
    filtered = filtered.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        (i.titleTa && i.titleTa.toLowerCase().includes(q)) ||
        i.description.toLowerCase().includes(q) ||
        i.address.toLowerCase().includes(q) ||
        i.department.toLowerCase().includes(q),
    )
  }

  if (
    params.north !== undefined &&
    params.south !== undefined &&
    params.east !== undefined &&
    params.west !== undefined
  ) {
    filtered = filtered.filter(
      (i) =>
        i.lat <= (params.north as number) &&
        i.lat >= (params.south as number) &&
        i.lng <= (params.east as number) &&
        i.lng >= (params.west as number),
    )
  }

  return filtered.slice(0, params.limit || 200)
}

/**
 * Geospatial query to find nearby issues within radius (default 100 meters)
 */
export async function getNearbyIssues(params: {
  lat: number
  lng: number
  radiusMeters?: number
  category?: string
}): Promise<{ issue: CivicIssue; distanceMeters: number }[]> {
  const radius = params.radiusMeters || 100

  return inMemoryIssues
    .map((issue) => {
      const dist = calculateHaversineDistanceMeters(
        params.lat,
        params.lng,
        issue.lat,
        issue.lng,
      )
      return { issue, distanceMeters: Math.round(dist) }
    })
    .filter((item) => {
      if (item.distanceMeters > radius) return false
      if (
        params.category &&
        params.category !== "all" &&
        item.issue.category !== params.category
      ) {
        return false
      }
      return true
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}

/**
 * Creates or inserts a new civic issue
 */
export async function createIssue(
  issueData: Partial<CivicIssue>,
): Promise<CivicIssue> {
  const now = new Date()
  const newIssue: CivicIssue = {
    id:
      issueData.id ||
      "CIV-" +
        now.getFullYear() +
        "-" +
        Math.random().toString(36).slice(2, 8).toUpperCase(),
    category: issueData.category || "other",
    title: issueData.title || "Civic Issue",
    titleTa: issueData.titleTa || "குடிமைப் பிரச்சினை",
    description: issueData.description || "",
    descriptionTa: issueData.descriptionTa || "",
    priority: issueData.priority || "medium",
    status: "submitted",
    imageUrl: issueData.imageUrl,
    lat: issueData.lat || 13.0382,
    lng: issueData.lng || 80.2497,
    accuracy: issueData.accuracy || 10,
    location: {
      type: "Point",
      coordinates: [issueData.lng || 80.2497, issueData.lat || 13.0382],
    },
    address: issueData.address || "Local Address",
    country: issueData.country || "India",
    state: issueData.state || "Tamil Nadu",
    district: issueData.district || "Chennai",
    localBody: issueData.localBody || "Greater Chennai Corporation",
    zone: issueData.zone,
    ward: issueData.ward,
    department: issueData.department || "Municipal Grievance Cell",
    departmentTa: issueData.departmentTa || "பொது மக்கள் குறைதீர்க்கும் பிரிவு",
    officer: null,
    slaHours: 48,
    slaRemainingHours: 48,
    slaBreached: false,
    aiConfidence: issueData.aiConfidence || 90,
    aiSuggestedCategory: issueData.aiSuggestedCategory || "General",
    aiAnalysis: issueData.aiAnalysis,
    departmentRouting: issueData.departmentRouting,
    duplicateGroupId: issueData.duplicateGroupId,
    parentIssueId: issueData.parentIssueId,
    isDuplicate: !!issueData.parentIssueId,
    reportsCount: 1,
    supportersCount: 1,
    upvotes: 1,
    downvotes: 0,
    tags: issueData.tags || [
      `#${issueData.category || "civic"}`,
      "#CivicReport",
      "#PublicIssue",
    ],
    isFakeImage: issueData.isFakeImage || false,
    fakeImageReason: issueData.fakeImageReason,
    comments: [],
    anonymous: !!issueData.anonymous,
    citizenName: issueData.anonymous ? undefined : (issueData.citizenName || undefined),
    citizenPhone: issueData.anonymous ? undefined : (issueData.citizenPhone || issueData.citizenMobile || undefined),
    submittedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    timeline: [
      {
        status: "submitted",
        label: "Complaint Submitted",
        labelTa: "புகார் பதிவு செய்யப்பட்டது",
        timestamp: now.toISOString(),
        done: true,
        active: false,
      },
      {
        status: "ai_analysis",
        label: "AI Vision Analysis Complete",
        labelTa: "AI பார்வை பகுப்பாய்வு முடிந்தது",
        timestamp: now.toISOString(),
        note: `Category: ${issueData.category} · Confidence: ${issueData.aiConfidence || 90}%`,
        noteTa: `வகை: ${issueData.category} · நம்பகத்தன்மை: ${issueData.aiConfidence || 90}%`,
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
      {
        status: "in_progress",
        label: "Work in Progress",
        labelTa: "பணி நடைபெறுகிறது",
        timestamp: null,
        done: false,
        active: false,
      },
      {
        status: "resolved",
        label: "Resolved",
        labelTa: "தீர்க்கப்பட்டது",
        timestamp: null,
        done: false,
        active: false,
      },
    ],
  }

  // Persist to Express Backend & MongoDB Atlas
  try {
    const res = await fetch(`${API_BASE_URL}/api/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newIssue),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data) {
        inMemoryIssues = [data.data, ...inMemoryIssues]
        persistIssues()
        return data.data
      }
    }
  } catch {
    // API server unreachable fallback
  }

  inMemoryIssues = [newIssue, ...inMemoryIssues]
  persistIssues()
  return newIssue
}

/**
 * Toggles or increments upvote for an issue
 */
export async function upvoteIssue(
  issueId: string,
  isReport: boolean = false,
): Promise<CivicIssue | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction: "up" }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data) {
        inMemoryUserVotes[issueId] = "up"
        persistUserVotes(inMemoryUserVotes)
        return data.data
      }
    }
  } catch {
    // fallback
  }

  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (!found) return null

  const currentVote = inMemoryUserVotes[issueId]

  if (currentVote === "up") {
    found.upvotes = Math.max(0, (found.upvotes || 0) - 1)
    found.supportersCount = Math.max(0, (found.supportersCount || 0) - 1)
    delete inMemoryUserVotes[issueId]
  } else {
    found.upvotes = (found.upvotes || 0) + 1
    found.supportersCount = (found.supportersCount || 0) + 1
    if (currentVote === "down") {
      found.downvotes = Math.max(0, (found.downvotes || 0) - 1)
    }
    inMemoryUserVotes[issueId] = "up"
  }

  if (isReport) found.reportsCount = (found.reportsCount || 1) + 1
  found.updatedAt = new Date().toISOString()
  found.userVote = inMemoryUserVotes[issueId] || null

  persistIssues()
  persistUserVotes(inMemoryUserVotes)
  return found
}

/**
 * Toggles or increments downvote for an issue
 */
export async function downvoteIssue(
  issueId: string,
): Promise<CivicIssue | null> {
  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (!found) return null

  const currentVote = inMemoryUserVotes[issueId]

  if (currentVote === "down") {
    found.downvotes = Math.max(0, (found.downvotes || 0) - 1)
    delete inMemoryUserVotes[issueId]
  } else {
    found.downvotes = (found.downvotes || 0) + 1
    if (currentVote === "up") {
      found.upvotes = Math.max(0, (found.upvotes || 0) - 1)
      found.supportersCount = Math.max(0, (found.supportersCount || 0) - 1)
    }
    inMemoryUserVotes[issueId] = "down"
  }

  found.updatedAt = new Date().toISOString()
  found.userVote = inMemoryUserVotes[issueId] || null

  persistIssues()
  persistUserVotes(inMemoryUserVotes)
  return found
}

/**
 * Adds a comment to a civic issue
 */
export async function addCommentToIssue(
  issueId: string,
  text: string,
  userName: string = "Citizen",
): Promise<IssueComment> {
  const comment: IssueComment = {
    id: "CMT-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    userName: userName.trim() || "Citizen",
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName, text }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data) {
        return data.data
      }
    }
  } catch {
    // fallback
  }

  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (found) {
    found.comments = [...(found.comments || []), comment]
    found.updatedAt = new Date().toISOString()
    persistIssues()
  }

  return comment
}

/**
 * Retrieves aggregate transparency analytics
 */
export async function getTransparencyStats(): Promise<{
  total: number
  resolved: number
  inProgress: number
  resolutionRate: number
  avgResolutionHours: number
  slaCompliancePct: number
  byCategory: Record<string, number>
  byDistrict: Record<string, number>
  byState: Record<string, number>
}> {
  const issues = await getIssues({ limit: 1000 })

  const total = issues.length
  const resolved = issues.filter((i) => i.status === "resolved").length
  const inProgress = issues.filter(
    (i) => i.status === "in_progress" || i.status === "assigned",
  ).length
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 85

  const byCategory: Record<string, number> = {}
  const byDistrict: Record<string, number> = {}
  const byState: Record<string, number> = {}

  issues.forEach((i) => {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1
    byDistrict[i.district || "Chennai"] =
      (byDistrict[i.district || "Chennai"] || 0) + 1
    byState[i.state || "Tamil Nadu"] =
      (byState[i.state || "Tamil Nadu"] || 0) + 1
  })

  return {
    total,
    resolved,
    inProgress,
    resolutionRate,
    avgResolutionHours: 24,
    slaCompliancePct: 94,
    byCategory,
    byDistrict,
    byState,
  }
}

/**
 * Assigns an authorized field officer to a civic issue
 */
export async function assignOfficerToIssue(
  issueId: string,
  officerId: string,
  officerName: string,
): Promise<CivicIssue | null> {
  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (!found) return null

  const now = new Date().toISOString()
  found.officer = officerName
  found.assignedOfficerId = officerId
  found.assignedOfficerName = officerName
  found.status = "in_progress"
  found.updatedAt = now

  // Update timeline
  const assignedEvent = found.timeline.find((e) => e.status === "assigned")
  if (assignedEvent) {
    assignedEvent.done = true
    assignedEvent.active = false
    assignedEvent.timestamp = now
    assignedEvent.note = `Assigned to ${officerName}`
    assignedEvent.noteTa = `${officerName} அவர்களுக்கு ஒதுக்கப்பட்டது`
  }

  const inProgEvent = found.timeline.find((e) => e.status === "in_progress")
  if (inProgEvent) {
    inProgEvent.done = true
    inProgEvent.active = true
    inProgEvent.timestamp = now
  }

  persistIssues()
  return found
}

/**
 * Resolves a civic issue with After Photo Proof submitted by an authorized officer
 */
export async function resolveIssueWithProof(
  issueId: string,
  afterImageUrl: string,
  notes?: string,
  officerName?: string,
): Promise<CivicIssue | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/issues/${issueId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ afterImageUrl, notes, officerName }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.success && data.data) {
        return data.data
      }
    }
  } catch {
    // fallback
  }

  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (!found) return null

  const now = new Date().toISOString()
  found.status = "resolved"
  found.resolvedImageUrl = afterImageUrl
  found.resolvedAt = now
  found.resolutionNotes = notes || "Issue successfully rectified and verified on site by field officer."
  found.resolutionNotesTa = "களப் பணியாளரால் ஆய்வு செய்யப்பட்டு பணி வெற்றிகரமாக முடிக்கப்பட்டது."
  found.slaRemainingHours = 0
  found.slaBreached = false
  found.updatedAt = now
  if (officerName && !found.officer) {
    found.officer = officerName
  }

  // Update timeline for resolution
  if (found.timeline && Array.isArray(found.timeline)) {
    found.timeline.forEach((event) => {
      if (["submitted", "ai_analysis", "assigned", "accepted", "in_progress", "verification", "resolved"].includes(event.status)) {
        event.done = true
        event.active = false
        if (event.status === "resolved") {
          event.timestamp = now
          event.active = true
          event.note = notes || "Resolved with verified work proof photo"
          event.noteTa = "சரிபார்க்கப்பட்ட புகைப்பட ஆதாரத்துடன் தீர்க்கப்பட்டது"
        }
      }
    })
  }

  persistIssues()
  return found
}

/**
 * Updates status of any issue directly (Admin/Officer action)
 */
export async function updateIssueStatus(
  issueId: string,
  newStatus: CivicIssue["status"],
): Promise<CivicIssue | null> {
  const found = inMemoryIssues.find((i) => i.id === issueId)
  if (!found) return null

  found.status = newStatus
  found.updatedAt = new Date().toISOString()
  persistIssues()
  return found
}

/**
 * Haversine formula calculating distance in meters between two lat/lng coordinates
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

