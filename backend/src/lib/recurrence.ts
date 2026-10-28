import { haversineMeters } from "./geo.js"

export type RecurrenceIssue = {
  id: string
  lat: number
  lng: number
  category: string
  submittedAt: string
  status: string
  resolvedAt?: string | null
}

export type RecurrenceCandidate = {
  previousIssueId: string
  distanceMeters: number
  daysSincePrevious: number
  sameCategory: boolean
  previousResolved: boolean
}

const DEFAULT_RADIUS_M = 75
const DEFAULT_WINDOW_DAYS = 180

export function findRecurrenceCandidates(
  current: RecurrenceIssue,
  previousIssues: RecurrenceIssue[],
  options?: { radiusMeters?: number; windowDays?: number },
): RecurrenceCandidate[] {
  const radius = options?.radiusMeters ?? DEFAULT_RADIUS_M
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS
  const currentTime = Date.parse(current.submittedAt)
  if (!Number.isFinite(currentTime)) return []

  return previousIssues
    .filter((issue) => issue.id !== current.id)
    .map((issue) => {
      const prevTime = Date.parse(issue.submittedAt)
      const distance = haversineMeters(current.lat, current.lng, issue.lat, issue.lng)
      const daysSincePrevious = (currentTime - prevTime) / 86400000
      const previousResolved = ["resolved", "closed", "verified"].includes(issue.status) || Boolean(issue.resolvedAt)
      return {
        previousIssueId: issue.id,
        distanceMeters: Math.round(distance),
        daysSincePrevious: Math.round(daysSincePrevious * 10) / 10,
        sameCategory: issue.category === current.category,
        previousResolved,
      }
    })
    .filter(
      (candidate) =>
        candidate.distanceMeters <= radius &&
        candidate.daysSincePrevious > 0 &&
        candidate.daysSincePrevious <= windowDays &&
        candidate.sameCategory,
    )
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}
