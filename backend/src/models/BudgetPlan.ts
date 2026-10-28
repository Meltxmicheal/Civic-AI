import mongoose, { Schema, Document } from "mongoose"

export interface IBudgetPlan extends Document {
  id: string
  name: string
  department?: string
  ward?: string
  periodStart: string
  periodEnd: string
  availableBudget: number
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

const BudgetPlanSchema = new Schema<IBudgetPlan>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  department: { type: String },
  ward: { type: String },
  periodStart: { type: String, required: true },
  periodEnd: { type: String, required: true },
  availableBudget: { type: Number, required: true, min: 0 },
  notes: { type: String },
  createdBy: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
})

export const BudgetPlanModel = mongoose.model<IBudgetPlan>("BudgetPlan", BudgetPlanSchema)
