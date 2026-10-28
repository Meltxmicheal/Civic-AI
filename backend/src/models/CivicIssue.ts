import mongoose, { Schema, Document } from "mongoose"

export interface IComment {
  id: string
  userName: string
  text: string
  createdAt: string
}

export interface ITimelineItem {
  status: string
  label: string
  labelTa: string
  timestamp: string | null
  note?: string
  noteTa?: string
  done: boolean
  active: boolean
}

export interface ICivicIssue extends Document {
  id: string
  category: string
  title: string
  titleTa?: string
  description: string
  descriptionTa?: string
  priority: string
  status: string
  lat: number
  lng: number
  accuracy?: number
  location?: {
    type: string
    coordinates: number[]
  }
  address: string
  country: string
  state: string
  district: string
  localBody?: string
  zone?: string
  ward?: string
  department: string
  departmentTa?: string
  officer?: string | null
  slaHours?: number
  slaRemainingHours?: number
  slaBreached?: boolean
  aiConfidence?: number
  aiSuggestedCategory?: string
  reportsCount?: number
  supportersCount?: number
  upvotes?: number
  downvotes?: number
  comments?: IComment[]
  imageUrl?: string
  resolvedImageUrl?: string
  resolvedAt?: string
  resolutionNotes?: string
  resolutionNotesTa?: string
  anonymous?: boolean
  citizenName?: string
  citizenPhone?: string
  departmentId?: string
  costEstimate?: number | null
  costEstimateSource?: string
  costUnknown?: boolean
  safetyRiskScore?: number | null
  safetyRiskSource?: string
  affectedPopulation?: number | null
  affectedPopulationSource?: string
  recurrenceCount?: number | null
  roadImportanceScore?: number | null
  roadImportanceSource?: string
  priorityScore?: number | null
  priorityScoreIncomplete?: boolean
  priorityExplanation?: string
  budgetPlanningStatus?: string
  submittedAt: string
  updatedAt: string
  timeline?: ITimelineItem[]
}

const CommentSchema = new Schema<IComment>(
  {
    id: { type: String, required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false },
)

const TimelineItemSchema = new Schema<ITimelineItem>(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    labelTa: { type: String, required: true },
    timestamp: { type: String, default: null },
    note: { type: String },
    noteTa: { type: String },
    done: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
  },
  { _id: false },
)

const CivicIssueSchema = new Schema<ICivicIssue>(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true, index: true },
    title: { type: String, required: true },
    titleTa: { type: String },
    description: { type: String, required: true },
    descriptionTa: { type: String },
    priority: { type: String, required: true, default: "medium" },
    status: { type: String, required: true, default: "submitted", index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: { type: Number, default: 10 },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], index: "2dsphere" },
    },
    address: { type: String, required: true },
    country: { type: String, default: "India" },
    state: { type: String, required: true, index: true },
    district: { type: String, required: true, index: true },
    localBody: { type: String },
    zone: { type: String },
    ward: { type: String },
    department: { type: String, required: true },
    departmentTa: { type: String },
    officer: { type: String, default: null },
    slaHours: { type: Number, default: 48 },
    slaRemainingHours: { type: Number, default: 48 },
    slaBreached: { type: Boolean, default: false },
    aiConfidence: { type: Number, default: 90 },
    aiSuggestedCategory: { type: String },
    reportsCount: { type: Number, default: 1 },
    supportersCount: { type: Number, default: 1 },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    comments: { type: [CommentSchema], default: [] },
    imageUrl: { type: String, default: null },
    resolvedImageUrl: { type: String, default: null },
    resolvedAt: { type: String, default: null },
    resolutionNotes: { type: String, default: null },
    resolutionNotesTa: { type: String, default: null },
    anonymous: { type: Boolean, default: true },
    citizenName: { type: String },
    citizenPhone: { type: String },
    departmentId: { type: String },
    costEstimate: { type: Number, default: null },
    costEstimateSource: { type: String, default: "unavailable" },
    costUnknown: { type: Boolean, default: true },
    safetyRiskScore: { type: Number, default: null },
    safetyRiskSource: { type: String, default: "unavailable" },
    affectedPopulation: { type: Number, default: null },
    affectedPopulationSource: { type: String, default: "unavailable" },
    recurrenceCount: { type: Number, default: null },
    roadImportanceScore: { type: Number, default: null },
    roadImportanceSource: { type: String, default: "unavailable" },
    priorityScore: { type: Number, default: null },
    priorityScoreIncomplete: { type: Boolean, default: true },
    priorityExplanation: { type: String },
    budgetPlanningStatus: { type: String, default: "unplanned" },
    submittedAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
    timeline: { type: [TimelineItemSchema], default: [] },
  },
  {
    timestamps: true,
  },
)

export const CivicIssueModel = mongoose.model<ICivicIssue>("CivicIssue", CivicIssueSchema)
