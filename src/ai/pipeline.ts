import {
  ImageAnalysisRequestSchema,
  CombinedAIAnalysisResultSchema,
  ENUM_TO_CATEGORY_KEY,
  CivicCategoryEnum,
  type ImageAnalysisRequest,
  type AIAnalysisResponse,
  type CombinedAIAnalysisResult,
  type CivicCategoryEnumType,
} from "./types.ts"
import { analyzeImageWithGeminiVision } from "./genkit.ts"

const CATEGORY_NAMES_EN: Record<CivicCategoryEnumType, string> = {
  ROADS: "Roads & Footpaths",
  GARBAGE: "Garbage & Sanitation",
  STREET_LIGHTS: "Street Lights",
  WATER: "Water Supply",
  DRAINAGE: "Drainage & Sewage",
  TRAFFIC: "Traffic & Parking",
  PARKS: "Parks & Trees",
  PUBLIC_BUILDINGS: "Public Buildings",
  ANIMAL: "Stray Animals & Cattle",
  FIRE: "Fire & Safety Hazard",
  OTHER: "Other Municipal Issue",
}

const CATEGORY_NAMES_TA: Record<CivicCategoryEnumType, string> = {
  ROADS: "சாலைகள் & நடைபாதைகள்",
  GARBAGE: "குப்பை & சுகாதாரம்",
  STREET_LIGHTS: "தெரு விளக்குகள்",
  WATER: "குடிநீர் விநியோகம்",
  DRAINAGE: "கழிவுநீர் வடிகால்",
  TRAFFIC: "போக்குவரத்து & பார்க்கிங்",
  PARKS: "பூங்காக்கள் & மரங்கள்",
  PUBLIC_BUILDINGS: "பொதுக் கட்டிடங்கள்",
  ANIMAL: "தெரு விலங்குகள் & கால்நடைகள்",
  FIRE: "தீ & பாதுகாப்பு அபாயம்",
  OTHER: "பிற நகராட்சிப் பிரச்சினை",
}

// In-memory rate limiting tracker (max 60 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(clientId: string = "default"): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxReq = 60

  const record = rateLimitMap.get(clientId)
  if (!record || now > record.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxReq) {
    return false
  }

  record.count++
  return true
}

/**
 * Unified CivicAI Vision Analysis Pipeline
 *
 * Pipeline:
 * 1. Zod schema validation
 * 2. Rate limiting check
 * 3. Unified Gemini Vision execution with Fake Detection, Civic Validation,
 *    Smart Title, Description, Severity, Department Routing, and Hashtags
 * 4. Resilient timeout & error boundary
 */
export async function analyzeCivicImage(
  rawInput: unknown,
): Promise<AIAnalysisResponse> {
  // 1. Rate Limiting Check
  if (!checkRateLimit("citizen-session")) {
    return {
      success: false,
      error: {
        code: "rateLimited",
        message: "Too many requests. Please wait a moment and try again.",
        messageTa:
          "அதிக கோரிக்கைகள் வந்துள்ளன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
      },
    }
  }

  // 2. Validate input schema with Zod
  const validationResult = ImageAnalysisRequestSchema.safeParse(rawInput)
  if (!validationResult.success) {
    const errorMsg =
      validationResult.error.issues[0]?.message || "Invalid image payload"
    return {
      success: false,
      error: {
        code: "invalidImage",
        message: `Please upload a valid image (JPEG, PNG, WEBP). ${errorMsg}`,
        messageTa: "செல்லுபடியாகும் புகைப்படத்தை (JPEG, PNG, WEBP) பதிவேற்றவும்.",
      },
    }
  }

  const input: ImageAnalysisRequest = validationResult.data

  // 3. Additional payload validation
  if (!input.photoDataUri.startsWith("data:image/")) {
    return {
      success: false,
      error: {
        code: "invalidImage",
        message: "Invalid image format. Supported formats: JPEG, PNG, WEBP.",
        messageTa: "செல்லாத பட வடிவம். ஆதரிக்கப்படும் வடிவங்கள்: JPEG, PNG, WEBP.",
      },
    }
  }

  // 4. Unified Gemini Vision Analysis
  try {
    const analysis = await analyzeImageWithGeminiVision(
      input.photoDataUri,
      input.description,
      input.locale,
    )

    const catEnum: CivicCategoryEnumType =
      analysis.category in CivicCategoryEnum
        ? (analysis.category as CivicCategoryEnumType)
        : CivicCategoryEnum.ROADS
    const catKey = ENUM_TO_CATEGORY_KEY[catEnum] || "other"
    const isLowConfidence = analysis.confidence < 70

    const result: CombinedAIAnalysisResult = {
      id: "AI-RES-" + Math.random().toString(36).slice(2, 9).toUpperCase(),
      categoryEnum: catEnum,
      categoryKey: catKey,
      categoryLabel: CATEGORY_NAMES_EN[catEnum] || "Other Issue",
      categoryLabelTa: CATEGORY_NAMES_TA[catEnum] || "பிற பிரச்சினை",
      detectedEntity: analysis.detectedEntity,
      detectedEntityTa: analysis.detectedEntityTa,
      confidence: analysis.confidence,
      severity: analysis.severity,
      severityReason: analysis.severityReason,
      severityReasonTa: analysis.severityReasonTa,
      suggestedDepartment: analysis.suggestedDepartment,
      suggestedDepartmentTa: analysis.suggestedDepartmentTa,
      departmentConfidence: analysis.departmentConfidence,
      observations: analysis.observations,
      observationsTa: analysis.observationsTa,
      suggestedTitle: analysis.smartTitle,
      suggestedTitleTa: analysis.smartTitleTa,
      smartTitle: analysis.smartTitle,
      smartTitleTa: analysis.smartTitleTa,
      smartDescription: analysis.smartDescription,
      smartDescriptionTa: analysis.smartDescriptionTa,
      isCivicIssue: analysis.isCivicIssue,
      isLowConfidence,
      isFakeImage: analysis.isFakeImage,
      fakeImageReason: analysis.fakeImageReason,
      authenticityConfidence: analysis.authenticityConfidence,
      tags: analysis.tags,
      analyzedAt: new Date().toISOString(),
    }

    // Validate outgoing payload against Zod Schema
    const schemaCheck = CombinedAIAnalysisResultSchema.safeParse(result)
    if (!schemaCheck.success) {
      console.error(
        "Pipeline Schema Validation Issues:",
        JSON.stringify(schemaCheck.error.issues, null, 2),
      )
      return {
        success: true,
        data: result,
      }
    }

    return {
      success: true,
      data: schemaCheck.data,
    }
  } catch (err: unknown) {
    console.error("analyzeCivicImage caught error:", err)
    return {
      success: false,
      error: {
        code: "serverError",
        message:
          "CivicAI analysis is temporarily unavailable. You can continue by selecting the issue manually.",
        messageTa:
          "CivicAI பகுப்பாய்வு தற்காலிகமாக கிடைக்கவில்லை. வகையை நீங்களே தேர்வு செய்து தொடரலாம்.",
      },
    }
  }
}
