import mongoose, { Schema, Document } from "mongoose"

export interface IContractor extends Document {
  id: string
  name: string
  email: string
  phone?: string
  department?: string
  workTypes: string[]
  passwordHash: string
  active: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

const ContractorSchema = new Schema<IContractor>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: String,
  department: String,
  workTypes: { type: [String], default: [] },
  passwordHash: { type: String, required: true },
  active: { type: Boolean, default: true },
  notes: String,
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
})

export const ContractorModel = mongoose.model<IContractor>("Contractor", ContractorSchema)
