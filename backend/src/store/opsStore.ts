import { isMongoReady } from "../lib/persistence.js"
import { BudgetPlanModel } from "../models/BudgetPlan.js"
import { PrioritySettingsModel } from "../models/PrioritySettings.js"
import { WorkOrderModel } from "../models/WorkOrder.js"
import { ContractorModel } from "../models/Contractor.js"
import { RecurrenceReviewModel } from "../models/RecurrenceReview.js"
import { IntegrationModel } from "../models/Integration.js"
import { SensorReadingModel } from "../models/SensorReading.js"
import { DEFAULT_WEIGHTS, type PriorityWeights } from "../lib/priority.js"
import { hashSecret } from "../lib/auth.js"

type MemoryDoc = Record<string, any>

export const memory = {
  budgetPlans: [] as MemoryDoc[],
  workOrders: [] as MemoryDoc[],
  contractors: [] as MemoryDoc[],
  recurrences: [] as MemoryDoc[],
  integrations: [] as MemoryDoc[],
  readings: [] as MemoryDoc[],
  weights: { id: "default", weights: { ...DEFAULT_WEIGHTS }, updatedAt: new Date().toISOString() } as MemoryDoc,
}

function upsertMemory(list: MemoryDoc[], doc: MemoryDoc): void {
  const idx = list.findIndex((item) => item.id === doc.id)
  if (idx >= 0) list[idx] = doc
  else list.push(doc)
}

function publicContractor(doc: MemoryDoc) {
  const { passwordHash, ...rest } = doc
  return rest
}

export async function saveBudgetPlan(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.budgetPlans, doc)
  if (isMongoReady()) {
    await BudgetPlanModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listBudgetPlans(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await BudgetPlanModel.find({}).sort({ updatedAt: -1 }).lean()
    if (rows.length) {
      memory.budgetPlans = rows as MemoryDoc[]
      return rows as MemoryDoc[]
    }
  }
  return [...memory.budgetPlans]
}

export async function getBudgetPlan(id: string): Promise<MemoryDoc | null> {
  if (isMongoReady()) {
    const row = await BudgetPlanModel.findOne({ id }).lean()
    if (row) return row as MemoryDoc
  }
  return memory.budgetPlans.find((p) => p.id === id) || null
}

export async function getWeights(): Promise<PriorityWeights> {
  if (isMongoReady()) {
    const row = await PrioritySettingsModel.findOne({ id: "default" }).lean()
    if (row?.weights) {
      memory.weights.weights = row.weights
      return row.weights as PriorityWeights
    }
  }
  return { ...memory.weights.weights }
}

export async function saveWeights(weights: PriorityWeights, updatedBy?: string): Promise<PriorityWeights> {
  const doc = {
    id: "default",
    weights,
    updatedBy,
    updatedAt: new Date().toISOString(),
  }
  memory.weights = doc
  if (isMongoReady()) {
    await PrioritySettingsModel.findOneAndUpdate({ id: "default" }, doc, { upsert: true, new: true })
  }
  return weights
}

export async function saveWorkOrder(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.workOrders, doc)
  if (isMongoReady()) {
    await WorkOrderModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listWorkOrders(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await WorkOrderModel.find({}).sort({ updatedAt: -1 }).lean()
    if (rows.length) {
      memory.workOrders = rows as MemoryDoc[]
      return rows as MemoryDoc[]
    }
  }
  return [...memory.workOrders]
}

export async function getWorkOrder(id: string): Promise<MemoryDoc | null> {
  if (isMongoReady()) {
    const row = await WorkOrderModel.findOne({ id }).lean()
    if (row) return row as MemoryDoc
  }
  return memory.workOrders.find((w) => w.id === id) || null
}

export async function saveContractor(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.contractors, doc)
  if (isMongoReady()) {
    await ContractorModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listContractors(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await ContractorModel.find({}).lean()
    if (rows.length) {
      memory.contractors = rows as MemoryDoc[]
      return rows.map((r) => publicContractor(r as MemoryDoc))
    }
  }
  return memory.contractors.map(publicContractor)
}

export async function getContractor(id: string): Promise<MemoryDoc | null> {
  if (isMongoReady()) {
    const row = await ContractorModel.findOne({ id }).lean()
    if (row) return row as MemoryDoc
  }
  return memory.contractors.find((c) => c.id === id) || null
}

export async function findContractorByEmail(email: string): Promise<MemoryDoc | null> {
  const normalized = email.trim().toLowerCase()
  if (isMongoReady()) {
    const row = await ContractorModel.findOne({ email: normalized }).lean()
    if (row) return row as MemoryDoc
  }
  return memory.contractors.find((c) => c.email === normalized) || null
}

export async function saveRecurrence(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.recurrences, doc)
  if (isMongoReady()) {
    await RecurrenceReviewModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listRecurrences(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await RecurrenceReviewModel.find({}).lean()
    if (rows.length) {
      memory.recurrences = rows as MemoryDoc[]
      return rows as MemoryDoc[]
    }
  }
  return [...memory.recurrences]
}

export async function saveIntegration(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.integrations, doc)
  if (isMongoReady()) {
    await IntegrationModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listIntegrations(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await IntegrationModel.find({}).lean()
    if (rows.length) {
      memory.integrations = rows as MemoryDoc[]
      return rows as MemoryDoc[]
    }
  }
  return [...memory.integrations]
}

export async function saveReading(doc: MemoryDoc): Promise<MemoryDoc> {
  upsertMemory(memory.readings, doc)
  if (isMongoReady()) {
    await SensorReadingModel.findOneAndUpdate({ id: doc.id }, doc, { upsert: true, new: true })
  }
  return doc
}

export async function listReadings(): Promise<MemoryDoc[]> {
  if (isMongoReady()) {
    const rows = await SensorReadingModel.find({}).sort({ recordedAt: -1 }).limit(50).lean()
    if (rows.length) {
      memory.readings = rows as MemoryDoc[]
      return rows as MemoryDoc[]
    }
  }
  return [...memory.readings]
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

export function contractorPasswordHash(password = "pass123"): string {
  return hashSecret(password)
}
