import { civicIssueService } from "./civicIssueService.ts"
import type { CivicIssue, Category } from "../types/index.ts"

export interface DuplicateCheckInput {
  lat: number
  lng: number
  category: Category
  title?: string
  description?: string
  radiusMeters?: number
}

export interface DuplicateCheckResult {
  isDuplicateFound: boolean
  matchedIssue?: CivicIssue
  distanceMeters?: number
  matchConfidence: number
  similarityReason?: string
  similarityReasonTa?: string
  nearbyCandidatesCount: number
}

const CATEGORY_RELATEDNESS: Record<Category, Category[]> = {
  road: ["road", "traffic"],
  garbage: ["garbage", "other"],
  streetlight: ["streetlight", "other"],
  water: ["water", "drainage"],
  drainage: ["drainage", "water"],
  traffic: ["traffic", "road"],
  parks: ["parks", "other"],
  buildings: ["buildings", "other"],
  animal: ["animal", "other"],
  fire: ["fire", "other"],
  other: ["other"],
}

/**
 * Searches for existing civic issues within configurable radius (default 100 meters)
 * and evaluates location, category, and textual similarity to identify potential duplicates.
 */
export async function checkForDuplicateIssues(
  input: DuplicateCheckInput,
): Promise<DuplicateCheckResult> {
  const radius = input.radiusMeters || 100
  const nearby = await civicIssueService.getNearbyIssues(
    input.lat,
    input.lng,
    radius,
  )

  if (nearby.length === 0) {
    return {
      isDuplicateFound: false,
      matchConfidence: 0,
      nearbyCandidatesCount: 0,
    }
  }

  let bestMatch: CivicIssue | null = null
  let minDistance = Infinity
  let highestScore = 0
  let matchReason = ""
  let matchReasonTa = ""

  for (const item of nearby) {
    const candidate = item.issue
    const dist = item.distanceMeters

    // 1. Category Score (0 to 40 points)
    let catScore = 0
    if (candidate.category === input.category) {
      catScore = 40
    } else if (
      CATEGORY_RELATEDNESS[input.category]?.includes(candidate.category)
    ) {
      catScore = 20
    }

    // 2. Distance Score (0 to 40 points - closer means higher score)
    const distScore = Math.max(0, 40 * (1 - dist / radius))

    // 3. Textual / Keyword Similarity Score (0 to 20 points)
    const textScore = computeTextSimilarity(
      `${input.title || ""} ${input.description || ""}`,
      `${candidate.title} ${candidate.description}`,
    )

    const totalScore = Math.round(catScore + distScore + textScore)

    if (totalScore > highestScore && totalScore >= 55) {
      highestScore = totalScore
      bestMatch = candidate
      minDistance = dist

      if (candidate.category === input.category) {
        matchReason = `A similar ${candidate.category} report was found ${dist} meters away: "${candidate.title}".`
        matchReasonTa = `${dist} மீட்டர் தொலைவில் இதே போன்ற புகார் கண்டறியப்பட்டது: "${candidate.titleTa || candidate.title}".`
      } else {
        matchReason = `A related municipal issue was found ${dist} meters away.`
        matchReasonTa = `${dist} மீட்டர் தொலைவில் தொடர்புடைய புகார் கண்டறியப்பட்டது.`
      }
    }
  }

  if (bestMatch && highestScore >= 55) {
    return {
      isDuplicateFound: true,
      matchedIssue: bestMatch,
      distanceMeters: minDistance,
      matchConfidence: Math.min(99, highestScore),
      similarityReason: matchReason,
      similarityReasonTa: matchReasonTa,
      nearbyCandidatesCount: nearby.length,
    }
  }

  return {
    isDuplicateFound: false,
    matchConfidence: highestScore,
    nearbyCandidatesCount: nearby.length,
  }
}

function computeTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )
  const words2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

  if (words1.size === 0 || words2.size === 0) return 10 // Default baseline

  let intersection = 0
  for (const w of words1) {
    if (words2.has(w)) intersection++
  }

  const jaccard = intersection / (words1.size + words2.size - intersection)
  return Math.min(20, Math.round(jaccard * 40))
}
