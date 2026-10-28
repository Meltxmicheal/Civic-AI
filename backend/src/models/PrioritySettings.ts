import mongoose, { Schema, Document } from "mongoose"
import type { PriorityWeights } from "../lib/priority.js"

export interface IPrioritySettings extends Document {
  id: string
  weights: PriorityWeights
  updatedBy?: string
  updatedAt: string
}

const PrioritySettingsSchema = new Schema<IPrioritySettings>({
  id: { type: String, required: true, unique: true, default: "default" },
  weights: {
    safetyRisk: { type: Number, required: true },
    severity: { type: Number, required: true },
    affectedPopulation: { type: Number, required: true },
    recurrence: { type: Number, required: true },
    roadImportance: { type: Number, required: true },
  },
  updatedBy: { type: String },
  updatedAt: { type: String, default: () => new Date().toISOString() },
})

export const PrioritySettingsModel = mongoose.model<IPrioritySettings>(
  "PrioritySettings",
  PrioritySettingsSchema,
)
