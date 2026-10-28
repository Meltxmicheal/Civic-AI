import type { CivicCategoryEnumType, SmartTitleResult } from "../types.ts"

export interface GenerateSmartReportTitleInput {
  category: CivicCategoryEnumType
  detectedEntity?: string
  description?: string
  locale?: "en" | "ta"
}

const DEFAULT_TITLES: Record<CivicCategoryEnumType, { en: string; ta: string }> =
  {
    ROADS: {
      en: "Pothole & Road Surface Damage",
      ta: "சாலையில் குழி மற்றும் தார் சேதம்",
    },
    GARBAGE: {
      en: "Garbage Overflow & Solid Waste Clearance",
      ta: "குப்பை நிரம்பி வழிதல் & தூய்மைப் பணி",
    },
    STREET_LIGHTS: {
      en: "Non-functional Street Light Repair",
      ta: "எரியாத தெரு விளக்கு பழுது",
    },
    WATER: {
      en: "Water Supply Pipeline Leakage",
      ta: "குடிநீர் குழாய் உடைப்பு & கசிவு",
    },
    DRAINAGE: {
      en: "Blocked Stormwater Drain & Waterlogging",
      ta: "அடைபட்ட மழைநீர் வடிகால்",
    },
    TRAFFIC: {
      en: "Traffic Hazard & Signal Issue",
      ta: "போக்குவரத்து சிக்னல் பழுது",
    },
    PARKS: {
      en: "Fallen Tree Branch & Park Obstruction",
      ta: "விழுந்த மரம் & பூங்கா பராமரிப்பு",
    },
    PUBLIC_BUILDINGS: {
      en: "Public Property & Municipal Facility Damage",
      ta: "பொதுக் கட்டிட சேதம்",
    },
    ANIMAL: {
      en: "Stray Animals & Cattle Menace",
      ta: "தெரு விலங்குகள் மற்றும் மாடுகள் தொல்லை",
    },
    FIRE: {
      en: "Fire Hazard & Combustible Material Risk",
      ta: "தீ விபத்து அபாயம் மற்றும் பாதுகாப்பு நடவடிக்கை",
    },
    OTHER: {
      en: "Civic Complaint / General Grievance",
      ta: "பொது மக்கள் குறைதீர்ப்பு கோரிக்கை",
    },
  }

/**
 * Generates concise, professional complaint titles in English and Tamil
 */
export async function generateSmartReportTitle(
  input: GenerateSmartReportTitleInput,
): Promise<SmartTitleResult> {
  const defaults = DEFAULT_TITLES[input.category] || DEFAULT_TITLES.OTHER

  if (input.description && input.description.length > 5) {
    const snippet = input.description.slice(0, 45).trim()
    return {
      title: `${defaults.en} (${snippet}...)`,
      titleTa: `${defaults.ta} (${snippet}...)`,
    }
  }

  return {
    title: defaults.en,
    titleTa: defaults.ta,
  }
}
