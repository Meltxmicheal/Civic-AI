import type {
  Category,
  AdministrativeLocation,
  DepartmentRoutingInfo,
  DepartmentId,
  Priority,
} from "../types/index.ts"

export interface RoutingInput {
  category: Category
  severity: Priority
  location: Partial<AdministrativeLocation>
  aiSuggestedDepartment?: string
}

/**
 * Maps category and civic issue signals to one of the 9 Canonical Departments
 */
export function determineDepartmentRouting(
  input: RoutingInput,
): DepartmentRoutingInfo {
  const { category, severity, location, aiSuggestedDepartment } = input
  const state = (location.state || "Tamil Nadu").trim()
  const district = (location.district || "Chennai").trim()

  let departmentId: DepartmentId = "public-works"
  let finalDeptEn = "Public Works Department"
  let finalDeptTa = "பொதுப்பணித் துறை (சாலை & உள்கட்டமைப்பு)"
  let reason = "Routed to Public Works Department for road and civil infrastructure repair."
  let confidence = 96

  switch (category) {
    case "road":
      departmentId = "public-works"
      finalDeptEn = "Public Works Department"
      finalDeptTa = "பொதுப்பணித் துறை (சாலை & உள்கட்டமைப்பு)"
      reason = `Road/infrastructure repair in ${district}, ${state}.`
      break

    case "garbage":
      departmentId = "sanitation"
      finalDeptEn = "Sanitation & Solid Waste"
      finalDeptTa = "சுகாதாரம் & திடக்கழிவு மேலாண்மை"
      reason = `Solid waste collection and sanitation in ${district}.`
      break

    case "traffic":
      departmentId = "transportation"
      finalDeptEn = "Transportation & Traffic"
      finalDeptTa = "போக்குவரத்து & சிக்னல் மேலாண்மை"
      reason = `Traffic management, signal repair, and transit safety in ${district}.`
      break

    case "parks":
      departmentId = "parks-recreation"
      finalDeptEn = "Parks & Recreation"
      finalDeptTa = "பூங்காக்கள் & மரங்கள் பராமரிப்பு"
      reason = `Public park maintenance, tree hazard, and green zone care in ${district}.`
      break

    case "water":
    case "drainage":
      departmentId = "water-department"
      finalDeptEn = "Water Department & Drainage"
      finalDeptTa = "குடிநீர் வழங்கல் & கழிவுநீர் வாரியம்"
      reason = `Water supply pipeline, sewerage, and drainage canal clearance in ${district}.`
      break

    case "buildings":
      departmentId = "code-enforcement"
      finalDeptEn = "Code Enforcement & Safety"
      finalDeptTa = "நகராட்சி விதிகள் அமலாக்கம் & பாதுகாப்பு"
      reason = `Building structural safety, municipal codes, and encroachment inspection in ${district}.`
      break

    case "animal":
      departmentId = "animal-control"
      finalDeptEn = "Animal Control & Care"
      finalDeptTa = "விலங்கு கட்டுப்பாடு & கால்நடை பராமரிப்பு"
      reason = `Stray animal rescue, public rabies safety, and veterinary care in ${district}.`
      break

    case "streetlight":
      departmentId = "general-services"
      finalDeptEn = "General Services & Utilities"
      finalDeptTa = "பொது சேவைகள் & தெரு விளக்குகள்"
      reason = `Street lighting luminaire, pole replacement, and municipal utility electrical maintenance in ${district}.`
      break

    case "fire":
      departmentId = "fire-department"
      finalDeptEn = "Fire & Emergency Services"
      finalDeptTa = "தீயணைப்பு & அவசரகால மீட்புப் பிரிவு"
      reason = `Urgent fire safety, hazardous material, and rescue operation in ${district}.`
      break

    default:
      if (aiSuggestedDepartment?.toLowerCase().includes("sanitation") || aiSuggestedDepartment?.toLowerCase().includes("waste")) {
        departmentId = "sanitation"
        finalDeptEn = "Sanitation & Solid Waste"
        finalDeptTa = "சுகாதாரம் & திடக்கழிவு மேலாண்மை"
      } else if (aiSuggestedDepartment?.toLowerCase().includes("water")) {
        departmentId = "water-department"
        finalDeptEn = "Water Department & Drainage"
        finalDeptTa = "குடிநீர் வழங்கல் & கழிவுநீர் வாரியம்"
      } else if (aiSuggestedDepartment?.toLowerCase().includes("light")) {
        departmentId = "general-services"
        finalDeptEn = "General Services & Utilities"
        finalDeptTa = "பொது சேவைகள் & தெரு விளக்குகள்"
      } else {
        departmentId = "public-works"
        finalDeptEn = "Public Works Department"
        finalDeptTa = "பொதுப்பணித் துறை (சாலை & உள்கட்டமைப்பு)"
      }
      reason = `Auto-routed via AI vision inspection matching ${departmentId}.`
      break
  }

  return {
    suggestedDepartment: finalDeptEn,
    suggestedDepartmentTa: finalDeptTa,
    finalDepartment: finalDeptEn,
    finalDepartmentTa: finalDeptTa,
    departmentId,
    routingReason: reason,
    routingSource: "AI",
    confidence,
    routedAt: new Date().toISOString(),
  }
}
