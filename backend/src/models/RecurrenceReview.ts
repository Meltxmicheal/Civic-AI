import mongoose, { Schema, Document } from "mongoose"

export interface IRecurrenceReview extends Document {
  id: string
  currentIssueId: string
  previousIssueId: string
  previousWorkOrderId?: string | null
  status: "candidate" | "confirmed" | "rejected"
  distanceMeters: number
  reviewedBy?: string | null
  reviewedAt?: string | null
  note?: string
  createdAt: string
}

const RecurrenceReviewSchema = new Schema<IRecurrenceReview>({
  id: { type: String, required: true, unique: true, index: true },
  currentIssueId: { type: String, required: true, index: true },
  previousIssueId: { type: String, required: true, index: true },
  previousWorkOrderId: { type: String, default: null },
  status: { type: String, default: "candidate" },
  distanceMeters: { type: Number, required: true },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: String, default: null },
  note: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
})

export const RecurrenceReviewModel = mongoose.model<IRecurrenceReview>(
  "RecurrenceReview",
  RecurrenceReviewSchema,
)
