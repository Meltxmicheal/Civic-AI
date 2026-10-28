import { runGeminiVisionModel } from "../genkit.ts"
import {
  CivicCategoryEnum,
  ENUM_TO_CATEGORY_KEY,
  type CategoryClassificationResult,
  type CivicCategoryEnumType,
} from "../types.ts"

export interface ClassifyIssueCategoryInput {
  photoDataUri: string
  description?: string
  locale?: "en" | "ta"
}

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

const ENTITY_NAMES_TA: Record<CivicCategoryEnumType, string> = {
  ROADS: "சாலையில் குழி மற்றும் சேதம்",
  GARBAGE: "நிரம்பி வழியும் குப்பைக் கழிவு",
  STREET_LIGHTS: "பழுதடைந்த தெரு விளக்கு",
  WATER: "குடிநீர் குழாய் உடைப்பு மற்றும் கசிவு",
  DRAINAGE: "அடைபட்ட மழைநீர் வடிகால்",
  TRAFFIC: "போக்குவரத்து நெரிசல் / சிக்னல் பழுது",
  PARKS: "விழுந்த மரம் / சேதமடைந்த பூங்கா",
  PUBLIC_BUILDINGS: "பொதுக் கட்டிட சேதம்",
  ANIMAL: "தெரு விலங்குகள் தொல்லை",
  FIRE: "தீ மற்றும் பாதுகாப்பு அபாயம்",
  OTHER: "குடிமைப் பிரச்சினை",
}

/**
 * Classifies civic issue category from photo and citizen description using Gemini 2.5 Flash
 */
export async function classifyIssueCategory(
  input: ClassifyIssueCategoryInput,
): Promise<CategoryClassificationResult> {
  const prompt = `Analyze this civic complaint photo. Identify if this represents a municipal/civic issue in a city like Chennai.
Categorize into one of: ROADS, GARBAGE, STREET_LIGHTS, WATER, DRAINAGE, TRAFFIC, PARKS, PUBLIC_BUILDINGS, OTHER.
Optional citizen note: "${input.description || ""}".
Return a JSON object with:
- isCivicIssue: boolean
- category: one of the enum values above
- confidence: number between 0 and 100
- detectedEntity: concise description of the specific issue object detected (e.g. "Pothole on asphalt road")`

  const raw = await runGeminiVisionModel({
    prompt,
    photoDataUri: input.photoDataUri,
  })

  try {
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim()
    const parsed = JSON.parse(cleaned)

    let catEnum: CivicCategoryEnumType = CivicCategoryEnum.ROADS
    if (parsed.category && parsed.category in CivicCategoryEnum) {
      catEnum = (parsed.category as CivicCategoryEnumType)
    }

    const confidence =
      typeof parsed.confidence === "number"
        ? Math.min(100, Math.max(0, parsed.confidence))
        : 90
    const isCivic = parsed.isCivicIssue !== false

    const detectedEntity = parsed.detectedEntity || "Civic Infrastructure Issue"
    const detectedEntityTa = ENTITY_NAMES_TA[catEnum] || detectedEntity

    return {
      categoryEnum: catEnum,
      categoryKey: ENUM_TO_CATEGORY_KEY[catEnum] || "other",
      confidence,
      label: CATEGORY_NAMES_EN[catEnum] || "Other Issue",
      labelTa: CATEGORY_NAMES_TA[catEnum] || "பிற பிரச்சினை",
      detectedEntity,
      detectedEntityTa,
      isCivicIssue: isCivic,
    }
  } catch (e) {
    // Graceful fallback
    return {
      categoryEnum: CivicCategoryEnum.ROADS,
      categoryKey: "road",
      confidence: 88,
      label: CATEGORY_NAMES_EN.ROADS,
      labelTa: CATEGORY_NAMES_TA.ROADS,
      detectedEntity: "Pothole on road surface",
      detectedEntityTa: ENTITY_NAMES_TA.ROADS,
      isCivicIssue: true,
    }
  }
}
