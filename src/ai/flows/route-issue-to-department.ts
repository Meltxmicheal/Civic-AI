import type {
  CivicCategoryEnumType,
  DepartmentRoutingResult,
} from "../types.ts"

export interface RouteIssueToDepartmentInput {
  category: CivicCategoryEnumType
  severity: "low" | "medium" | "high" | "critical"
  description?: string
  locale?: "en" | "ta"
}

interface DepartmentInfo {
  name: string
  nameTa: string
  confidence: number
  observations: string
  observationsTa: string
}

const DEPARTMENT_LOOKUP: Record<CivicCategoryEnumType, DepartmentInfo> = {
  ROADS: {
    name: "Roads & Infrastructure",
    nameTa: "சாலைகள் மற்றும் உள்கட்டமைப்பு",
    confidence: 96,
    observations:
      "Pothole and road surface degradation identified for priority asphalt re-laying.",
    observationsTa:
      "சாலையில் குழி மற்றும் தார் மேற்பரப்பு சேதம் கண்டறியப்பட்டு முன்னுரிமை சீரமைப்புக்கு பரிந்துரைக்கப்பட்டுள்ளது.",
  },
  GARBAGE: {
    name: "Sanitation & Solid Waste Management",
    nameTa: "சுகாதாரம் மற்றும் திடக்கழிவு மேலாண்மை",
    confidence: 94,
    observations:
      "Solid waste accumulation requiring immediate municipal clearance truck dispatch.",
    observationsTa:
      "திடக்கழிவு குவிந்துள்ளதால் உடனடி தூய்மைப் பணிக்கு பரிந்துரைக்கப்படுகிறது.",
  },
  STREET_LIGHTS: {
    name: "Electrical & Street Lighting",
    nameTa: "மின்சாரம் மற்றும் தெரு விளக்குகள்",
    confidence: 93,
    observations:
      "Non-functional street luminaire needing bulb replacement or wiring check.",
    observationsTa:
      "பழுதடைந்த தெரு விளக்கு பழுதுநீக்க மின்சாரப் பிரிவுக்கு பரிந்துரைக்கப்படுகிறது.",
  },
  WATER: {
    name: "Water Supply & Sewerage Board (CMWSSB)",
    nameTa: "குடிநீர் வழங்கல் மற்றும் கழிவுநீரகற்று வாரியம்",
    confidence: 95,
    observations:
      "Water pipeline rupture causing surface pooling and drinking water loss.",
    observationsTa: "குடிநீர் குழாய் உடைப்பு காரணமாக தண்ணீர் வீணாவதை தடுக்க உடனடி பணி தேவை.",
  },
  DRAINAGE: {
    name: "Stormwater Drainage & Flood Control",
    nameTa: "மழைநீர் வடிகால் மற்றும் வெள்ளக் கட்டுப்பாடு",
    confidence: 92,
    observations:
      "Blocked drainage channel requiring de-silting and obstruction removal.",
    observationsTa:
      "வடிகாலில் அடைப்பு ஏற்பட்டுள்ளதால் தூர்வாரும் பணி பரிந்துரைக்கப்படுகிறது.",
  },
  TRAFFIC: {
    name: "Traffic Police & Road Safety Cell",
    nameTa: "போக்குவரத்து காவல்துறை & சாலைப் பாதுகாப்பு",
    confidence: 90,
    observations:
      "Traffic congestion / signal visibility disruption on major corridor.",
    observationsTa:
      "போக்குவரத்து சிக்னல் / சாலைப் பாதுகாப்பு சரிபார்ப்புக்கு அனுப்பப்பட்டுள்ளது.",
  },
  PARKS: {
    name: "Parks & Horticulture Department",
    nameTa: "பூங்காக்கள் மற்றும் தோட்டக்கலைத்துறை",
    confidence: 89,
    observations:
      "Tree branch fallen across public walkway requiring immediate clearing.",
    observationsTa: "விழுந்த மரக் கிளைகளை அகற்ற தோட்டக்கலைத்துறைக்கு அனுப்பப்பட்டுள்ளது.",
  },
  PUBLIC_BUILDINGS: {
    name: "Public Works Department (PWD)",
    nameTa: "பொதுப்பணித்துறை (PWD)",
    confidence: 88,
    observations: "Structural damage to municipal facility or public fence.",
    observationsTa:
      "பொதுக் கட்டிட பராமரிப்பு பணிக்கு பொதுப்பணித்துறைக்கு பரிந்துரைக்கப்படுகிறது.",
  },
  ANIMAL: {
    name: "Veterinary & Animal Husbandry Cell",
    nameTa: "கால்நடை மற்றும் விலங்கு நலப் பிரிவு",
    confidence: 91,
    observations: "Stray cattle or animal menace reported for capture/quarantine.",
    observationsTa: "தெரு விலங்குகள் மற்றும் கால்நடைகள் கட்டுப்பாடு பிரிவுக்கு பரிந்துரைக்கப்படுகிறது.",
  },
  FIRE: {
    name: "Fire & Rescue Services Department",
    nameTa: "தீயணைப்பு மற்றும் மீட்புப் பணிகள் துறை",
    confidence: 96,
    observations: "Combustible hazard or fire risk reported for urgent inspection.",
    observationsTa: "தீ அபாயம் கண்டறியப்பட்டு அவசர தீயணைப்பு மற்றும் மீட்புப் பணிக்கு பரிந்துரைக்கப்படுகிறது.",
  },
  OTHER: {
    name: "General Public Grievance Cell",
    nameTa: "பொது மக்கள் குறைதீர்க்கும் பிரிவு",
    confidence: 80,
    observations:
      "General municipal grievance routed to central municipal nodal desk.",
    observationsTa: "பொதுக் கோரிக்கை மைய குறைதீர்ப்பு பிரிவுக்கு அனுப்பப்பட்டுள்ளது.",
  },
}

/**
 * Recommends municipal department based on category and civic business rules
 * Note: This produces an "AI Recommendation", final administrative authority remains with municipal rules.
 */
export async function routeIssueToDepartment(
  input: RouteIssueToDepartmentInput,
): Promise<DepartmentRoutingResult> {
  const info = DEPARTMENT_LOOKUP[input.category] || DEPARTMENT_LOOKUP.OTHER

  return {
    suggestedDepartment: info.name,
    suggestedDepartmentTa: info.nameTa,
    departmentConfidence: info.confidence,
    observations: info.observations,
    observationsTa: info.observationsTa,
  }
}
