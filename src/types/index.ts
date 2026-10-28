export type Language = "en" | "ta"

export type Page =
  | "home"
  | "report"
  | "track"
  | "complaint-detail"
  | "map"
  | "transparency"
  | "citizen-dashboard"
  | "admin"
  | "officer"
  | "department"
  | "maintenance"
  | "work-orders"
  | "civic-intelligence"

export type StaffRole = "admin" | "department" | "officer" | "contractor" | null

export type ComplaintStatus =
  | "submitted"
  | "ai_analysis"
  | "assigned"
  | "accepted"
  | "in_progress"
  | "verification"
  | "resolved"
  | "reopened"
  | "closed"

export type Priority = "low" | "medium" | "high" | "critical"

export type Category =
  | "road"
  | "garbage"
  | "streetlight"
  | "water"
  | "drainage"
  | "traffic"
  | "parks"
  | "buildings"
  | "animal"
  | "fire"
  | "other"

export type DepartmentId =
  | "public-works"
  | "sanitation"
  | "transportation"
  | "parks-recreation"
  | "water-department"
  | "code-enforcement"
  | "animal-control"
  | "general-services"
  | "fire-department"

export interface TimelineEvent {
  status: ComplaintStatus
  label: string
  labelTa: string
  timestamp: string | null
  note?: string
  noteTa?: string
  done: boolean
  active: boolean
}

export interface GeoJSONPoint {
  type: "Point"
  coordinates: [number, number] // [longitude, latitude]
}

export interface AdministrativeLocation {
  country: string
  state: string
  district: string
  localBody?: string
  localBodyType?:
    | "corporation"
    | "municipality"
    | "town_panchayat"
    | "village_panchayat"
    | "other"
  zone?: string
  ward?: string
  formattedAddress: string
  pincode?: string
}

export interface IssueComment {
  id: string
  userId?: string
  userName: string
  text: string
  createdAt: string
}

export interface DepartmentRoutingInfo {
  suggestedDepartment: string
  suggestedDepartmentTa?: string
  finalDepartment: string
  finalDepartmentTa?: string
  departmentId?: DepartmentId
  routingReason: string
  routingSource: "AI" | "RULE" | "HUMAN_OVERRIDE"
  confidence: number
  routedAt: string
}

export interface CivicIssue {
  id: string
  category: Category
  title: string
  titleTa: string
  description: string
  descriptionTa?: string
  priority: Priority
  status: ComplaintStatus
  imageUrl?: string // Before Photo (Citizen upload)

  // Resolution Proof (Field Officer upload)
  resolvedImageUrl?: string // After Photo (Officer resolution proof)
  resolvedAt?: string
  resolutionNotes?: string
  resolutionNotesTa?: string

  // Citizen Profile (when using Verified Citizen Profile)
  citizenName?: string
  citizenPhone?: string
  citizenMobile?: string

  // Geospatial & Administrative
  lat: number
  lng: number
  accuracy?: number
  location?: GeoJSONPoint
  address: string
  country?: string
  state?: string
  district?: string
  localBody?: string
  zone?: string
  ward?: string

  // Department & AI
  department: string
  departmentTa: string
  departmentId?: DepartmentId
  officer: string | null
  assignedOfficerId?: string
  assignedOfficerName?: string
  slaHours: number
  slaRemainingHours: number
  slaBreached: boolean
  aiConfidence: number
  aiSuggestedCategory: string
  aiAnalysis?: {
    detectedEntity: string
    detectedEntityTa?: string
    severityReason?: string
    severityReasonTa?: string
    observations?: string
    observationsTa?: string
    analyzedAt: string
    isCivicIssue?: boolean
  }
  departmentRouting?: DepartmentRoutingInfo

  // Community & Duplicate Grouping
  duplicateGroupId?: string
  parentIssueId?: string
  isDuplicate?: boolean
  reportsCount?: number
  supportersCount?: number
  upvotes?: number
  downvotes?: number
  userVote?: "up" | "down" | null
  comments?: IssueComment[]
  tags?: string[]
  isFakeImage?: boolean
  fakeImageReason?: string

  // Meta
  anonymous: boolean
  submittedAt: string
  updatedAt: string
  timeline: TimelineEvent[]
}

// Backward-compatible alias for existing views
export type Complaint = CivicIssue

export interface DepartmentInfo {
  id: DepartmentId
  name: string
  nameTa: string
  shortName: string
  category: string
  icon: string
  color: string
  bgLight: string
  email: string
  dummyId: string
  dummyPassword: string
  headOfficer: string
  totalOfficers: number
  total: number
  open: number
  inProgress: number
  resolved: number
  slaBreached: number
  avgResolutionHours: number
  slaCompliancePct: number
  points: number
  rewardsBadge: string
  rank: number
}

export type Department = DepartmentInfo

export interface Officer {
  id: string
  name: string
  nameTa: string
  phone: string
  department: string
  departmentId: DepartmentId
  status: "online" | "offline" | "busy"
  assignedCount: number
  completedToday: number
  rating: number
  avatar?: string
}


export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  xlargeText: boolean
  reduceMotion: boolean
  lineSpacing: boolean
  highlightLinks: boolean
}

export interface AppContextType {
  lang: Language
  setLang: (l: Language) => void
  currentPage: Page
  navigate: (p: Page, complaintId?: string) => void
  selectedComplaintId: string | null
  accessibility: AccessibilitySettings
  setAccessibility: (a: AccessibilitySettings) => void
  chatOpen: boolean
  setChatOpen: (v: boolean) => void
  userLocation: { lat: number; lng: number; accuracy: number } | null
  setUserLocation: (
    loc: { lat: number; lng: number; accuracy: number } | null,
  ) => void
  geminiApiKey: string
  setGeminiApiKey?: (key: string) => void
  activeDepartmentId: DepartmentId
  setActiveDepartmentId: (deptId: DepartmentId) => void
  isAdminLoggedIn: boolean
  setIsAdminLoggedIn: (val: boolean) => void
  adminEmail: string | null
  setAdminEmail: (email: string | null) => void
  authToken: string | null
  staffRole: StaffRole
  setAuthSession: (session: { token: string | null; role: StaffRole; email: string | null }) => void
}



