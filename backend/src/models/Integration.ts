import mongoose, { Schema, Document } from "mongoose"

export type DataFidelity = "real" | "simulated" | "unavailable"

export interface IIntegration extends Document {
  id: string
  name: string
  purpose: string
  category: string
  connectionStatus: "connected" | "disconnected" | "not_configured"
  lastSuccessfulSync?: string | null
  dataSource: string
  configurationStatus: "configured" | "placeholder"
  dataFidelity: DataFidelity
  notes?: string
}

const IntegrationSchema = new Schema<IIntegration>({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  purpose: { type: String, required: true },
  category: { type: String, required: true },
  connectionStatus: { type: String, required: true },
  lastSuccessfulSync: { type: String, default: null },
  dataSource: { type: String, required: true },
  configurationStatus: { type: String, required: true },
  dataFidelity: { type: String, required: true },
  notes: String,
})

export const IntegrationModel = mongoose.model<IIntegration>("Integration", IntegrationSchema)
