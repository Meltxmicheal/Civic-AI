import { z } from "zod"
import type { Category } from "../types/index.ts"

/**
 * Stable internal category enum identifiers (never use localized text in database)
 */
export const CivicCategoryEnum = {
  ROADS: "ROADS",
  GARBAGE: "GARBAGE",
  STREET_LIGHTS: "STREET_LIGHTS",
  WATER: "WATER",
  DRAINAGE: "DRAINAGE",
  TRAFFIC: "TRAFFIC",
  PARKS: "PARKS",
  PUBLIC_BUILDINGS: "PUBLIC_BUILDINGS",
  ANIMAL: "ANIMAL",
  FIRE: "FIRE",
  OTHER: "OTHER",
} as const

export type CivicCategoryEnumType = typeof CivicCategoryEnum[keyof typeof CivicCategoryEnum]

/**
 * Mapping from CivicCategoryEnum to internal application category keys
 */
export const ENUM_TO_CATEGORY_KEY: Record<CivicCategoryEnumType, Category> = {
  ROADS: "road",
  GARBAGE: "garbage",
  STREET_LIGHTS: "streetlight",
  WATER: "water",
  DRAINAGE: "drainage",
  TRAFFIC: "traffic",
  PARKS: "parks",
  PUBLIC_BUILDINGS: "buildings",
  ANIMAL: "animal",
  FIRE: "fire",
  OTHER: "other",
}

export const CATEGORY_KEY_TO_ENUM: Record<Category, CivicCategoryEnumType> = {
  road: "ROADS",
  garbage: "GARBAGE",
  streetlight: "STREET_LIGHTS",
  water: "WATER",
  drainage: "DRAINAGE",
  traffic: "TRAFFIC",
  parks: "PARKS",
  buildings: "PUBLIC_BUILDINGS",
  animal: "ANIMAL",
  fire: "FIRE",
  other: "OTHER",
}

/**
 * AI Request Lifecycle States
 */
export type AIRequestState = "idle" | "validating" | "uploading" | "analyzing" | "success" | "lowConfidence" | "notCivicIssue" | "invalidImage" | "timeout" | "rateLimited" | "networkError" | "serverError" | "retrying"

/**
 * Zod Schemas for Input Validation
 */
export const ImageAnalysisRequestSchema = z.object({
  photoDataUri: z
    .string()
    .min(100, "Image data is too short")
    .refine((val) => val.startsWith("data:image/"), {
      message: "Must be a valid base64 image data URI",
    }),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/jpg"]),
  fileSizeBytes: z
    .number()
    .max(10 * 1024 * 1024, "Image size exceeds 10MB limit"),
  description: z.string().max(1000).optional().default(""),
  locale: z.enum(["en", "ta"]).default("en"),
})

export type ImageAnalysisRequest = z.infer<typeof ImageAnalysisRequestSchema>

export const CivicCategoryEnumValues = [
  "ROADS",
  "GARBAGE",
  "STREET_LIGHTS",
  "WATER",
  "DRAINAGE",
  "TRAFFIC",
  "PARKS",
  "PUBLIC_BUILDINGS",
  "ANIMAL",
  "FIRE",
  "OTHER",
] as const

/**
 * Zod Schemas for AI Flow Outputs
 */
export const CategoryClassificationResultSchema = z.object({
  categoryEnum: z.enum(CivicCategoryEnumValues),
  categoryKey: z.enum([
    "road",
    "garbage",
    "streetlight",
    "water",
    "drainage",
    "traffic",
    "parks",
    "buildings",
    "animal",
    "fire",
    "other",
  ]),
  confidence: z.number().min(0).max(100),
  label: z.string(),
  labelTa: z.string(),
  detectedEntity: z.string(),
  detectedEntityTa: z.string(),
  isCivicIssue: z.boolean(),
})

export type CategoryClassificationResult = z.infer<typeof CategoryClassificationResultSchema>

export const SeverityDetectionResultSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  reason: z.string(),
  reasonTa: z.string(),
  impactAssessment: z.string(),
})

export type SeverityDetectionResult = z.infer<typeof SeverityDetectionResultSchema>

export const DepartmentRoutingResultSchema = z.object({
  suggestedDepartment: z.string(),
  suggestedDepartmentTa: z.string(),
  departmentConfidence: z.number().min(0).max(100),
  observations: z.string(),
  observationsTa: z.string(),
})

export type DepartmentRoutingResult = z.infer<typeof DepartmentRoutingResultSchema>

export const SmartTitleResultSchema = z.object({
  title: z.string(),
  titleTa: z.string(),
})

export type SmartTitleResult = z.infer<typeof SmartTitleResultSchema>

/**
 * Combined AI Analysis Pipeline Result Schema
 */
export const CombinedAIAnalysisResultSchema = z.object({
  id: z.string(),
  categoryEnum: z.enum(CivicCategoryEnumValues),
  categoryKey: z.enum([
    "road",
    "garbage",
    "streetlight",
    "water",
    "drainage",
    "traffic",
    "parks",
    "buildings",
    "animal",
    "fire",
    "other",
  ]),
  categoryLabel: z.string(),
  categoryLabelTa: z.string(),
  detectedEntity: z.string(),
  detectedEntityTa: z.string(),
  confidence: z.number().min(0).max(100),
  severity: z.enum(["low", "medium", "high", "critical"]),
  severityReason: z.string(),
  severityReasonTa: z.string(),
  suggestedDepartment: z.string(),
  suggestedDepartmentTa: z.string(),
  departmentConfidence: z.number().min(0).max(100),
  observations: z.string(),
  observationsTa: z.string(),
  suggestedTitle: z.string(),
  suggestedTitleTa: z.string(),
  smartTitle: z.string().optional(),
  smartTitleTa: z.string().optional(),
  smartDescription: z.string().optional(),
  smartDescriptionTa: z.string().optional(),
  isCivicIssue: z.boolean(),
  isLowConfidence: z.boolean(),
  isFakeImage: z.boolean().optional(),
  fakeImageReason: z.string().optional(),
  authenticityConfidence: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  analyzedAt: z.string(),
})

export type CombinedAIAnalysisResult = z.infer<typeof CombinedAIAnalysisResultSchema>

/**
 * Server Response Envelope
 */
export interface AIAnalysisResponse {
  success: boolean
  data?: CombinedAIAnalysisResult
  error?: {
    code: AIRequestState
    message: string
    messageTa: string
  }
}
