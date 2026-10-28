import mongoose, { Schema, Document } from "mongoose"
import type { WorkOrderStatus } from "../lib/workflow.js"

export interface IAuditEvent {
  at: string
  actor: string
  role: string
  action: string
  fromStatus?: string
  toStatus?: string
  note?: string
}

export interface IWorkOrder extends Document {
  id: string
  complaintId: string
  department: string
  location: string
  ward?: string
  zone?: string
  lat?: number
  lng?: number
  workDescription: string
  priorityScore?: number | null
  contractorId?: string | null
  contractorName?: string | null
  estimatedCost?: number | null
  approvedCost?: number | null
  createdAt: string
  assignedAt?: string | null
  startDate?: string | null
  dueDate?: string | null
  completionDate?: string | null
  status: WorkOrderStatus
  beforeImageUrl?: string | null
  afterImageUrl?: string | null
  repairNotes?: string | null
  verificationStatus: "unverified" | "verified" | "rejected"
  verifyingOfficial?: string | null
  verifiedAt?: string | null
  slaHours?: number | null
  category?: string | null
  audit: IAuditEvent[]
  updatedAt: string
}

const AuditSchema = new Schema<IAuditEvent>(
  {
    at: String,
    actor: String,
    role: String,
    action: String,
    fromStatus: String,
    toStatus: String,
    note: String,
  },
  { _id: false },
)

const WorkOrderSchema = new Schema<IWorkOrder>({
  id: { type: String, required: true, unique: true, index: true },
  complaintId: { type: String, required: true, index: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  ward: String,
  zone: String,
  lat: Number,
  lng: Number,
  workDescription: { type: String, required: true },
  priorityScore: { type: Number, default: null },
  contractorId: { type: String, default: null, index: true },
  contractorName: { type: String, default: null },
  estimatedCost: { type: Number, default: null },
  approvedCost: { type: Number, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  assignedAt: { type: String, default: null },
  startDate: { type: String, default: null },
  dueDate: { type: String, default: null },
  completionDate: { type: String, default: null },
  status: { type: String, required: true, default: "created", index: true },
  beforeImageUrl: { type: String, default: null },
  afterImageUrl: { type: String, default: null },
  repairNotes: { type: String, default: null },
  verificationStatus: { type: String, default: "unverified" },
  verifyingOfficial: { type: String, default: null },
  verifiedAt: { type: String, default: null },
  slaHours: { type: Number, default: null },
  category: { type: String, default: null },
  audit: { type: [AuditSchema], default: [] },
  updatedAt: { type: String, default: () => new Date().toISOString() },
})

export const WorkOrderModel = mongoose.model<IWorkOrder>("WorkOrder", WorkOrderSchema)
