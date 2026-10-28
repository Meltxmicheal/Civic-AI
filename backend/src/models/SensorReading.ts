import mongoose, { Schema, Document } from "mongoose"

export interface ISensorReading extends Document {
  id: string
  integrationId: string
  kind: "weather" | "flood-sensor"
  locationLabel: string
  payload: Record<string, unknown>
  dataFidelity: "simulated"
  recordedAt: string
}

const SensorReadingSchema = new Schema<ISensorReading>({
  id: { type: String, required: true, unique: true },
  integrationId: { type: String, required: true, index: true },
  kind: { type: String, required: true },
  locationLabel: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, required: true },
  dataFidelity: { type: String, default: "simulated" },
  recordedAt: { type: String, required: true },
})

export const SensorReadingModel = mongoose.model<ISensorReading>("SensorReading", SensorReadingSchema)
