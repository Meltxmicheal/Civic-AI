import {
  getIssues,
  getNearbyIssues,
  createIssue,
  upvoteIssue,
  downvoteIssue,
  addCommentToIssue,
  getTransparencyStats,
  assignOfficerToIssue,
  resolveIssueWithProof,
  updateIssueStatus,
} from "../server/api.ts"
import type {
  CivicIssue,
  IssueComment,
  Priority,
  Category,
} from "../types/index.ts"

export interface IssueFilterParams {
  category?: string
  severity?: string
  status?: string
  state?: string
  district?: string
  department?: string
  search?: string
  north?: number
  south?: number
  east?: number
  west?: number
  limit?: number
}

class CivicIssueService {
  /**
   * Fetches issues matching viewport and active filters
   */
  async getIssues(filters: IssueFilterParams = {}): Promise<CivicIssue[]> {
    try {
      return await getIssues(filters)
    } catch (err) {
      console.warn("Error fetching issues:", err)
      return []
    }
  }

  /**
   * Finds nearby civic issues within radius (default 100 meters)
   */
  async getNearbyIssues(
    lat: number,
    lng: number,
    radiusMeters: number = 100,
    category?: string,
  ): Promise<{ issue: CivicIssue; distanceMeters: number }[]> {
    try {
      return await getNearbyIssues({ lat, lng, radiusMeters, category })
    } catch (err) {
      console.warn("Error finding nearby issues:", err)
      return []
    }
  }

  /**
   * Retrieves single complaint by ID
   */
  async getIssueById(id: string): Promise<CivicIssue | null> {
    const all = await this.getIssues({ limit: 1000 })
    return all.find((i) => i.id.toUpperCase() === id.toUpperCase()) || null
  }

  /**
   * Submits a new civic complaint
   */
  async createIssue(issue: Partial<CivicIssue>): Promise<CivicIssue> {
    return await createIssue(issue)
  }

  /**
   * Upvotes / supports an existing issue
   */
  async upvoteIssue(issueId: string): Promise<CivicIssue | null> {
    return await upvoteIssue(issueId)
  }

  /**
   * Downvotes an issue
   */
  async downvoteIssue(issueId: string): Promise<CivicIssue | null> {
    return await downvoteIssue(issueId)
  }

  /**
   * Adds citizen comment to an issue
   */
  async addComment(
    issueId: string,
    text: string,
    userName?: string,
  ): Promise<IssueComment> {
    return await addCommentToIssue(issueId, text, userName)
  }

  /**
   * Assigns an authorized officer to an issue
   */
  async assignOfficer(
    issueId: string,
    officerId: string,
    officerName: string,
  ): Promise<CivicIssue | null> {
    return await assignOfficerToIssue(issueId, officerId, officerName)
  }

  /**
   * Resolves an issue with field proof After photo
   */
  async resolveIssueWithProof(
    issueId: string,
    afterImageUrl: string,
    notes?: string,
    officerName?: string,
  ): Promise<CivicIssue | null> {
    return await resolveIssueWithProof(issueId, afterImageUrl, notes, officerName)
  }

  /**
   * Updates issue status directly
   */
  async updateStatus(
    issueId: string,
    status: CivicIssue["status"],
  ): Promise<CivicIssue | null> {
    return await updateIssueStatus(issueId, status)
  }

  /**
   * Retrieves platform aggregate statistics
   */
  async getTransparencyStats() {
    return await getTransparencyStats()
  }
}

export const civicIssueService = new CivicIssueService()

