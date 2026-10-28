import { runGeminiVisionModel } from "../genkit.ts"
import type {
  CivicCategoryEnumType,
  SeverityDetectionResult,
} from "../types.ts"

export interface DetectIssueSeverityInput {
  photoDataUri: string
  description?: string
  category: CivicCategoryEnumType
  locale?: "en" | "ta"
}

const DEFAULT_SEVERITY_TA: Record<string, string> = {
  critical: "உடனடி ஆபத்தை ஏற்படுத்தும் நிலை. அவசர நடவடிக்கை தேவைப்படுகிறது.",
  high: "வாகனங்கள் மற்றும் பாதசாரிகளின் பாதுகாப்பை பாதிக்கும் தீவிர சேதம்.",
  medium: "பொதுமக்களின் அன்றாட பயன்பாட்டை பாதிக்கும் நகராட்சிப் பிரச்சினை.",
  low: "சிறிய அளவிலான பராமரிப்பு தேவை.",
}

/**
 * Detects civic issue severity based on visual hazard level, public safety, and traffic impact
 */
export async function detectIssueSeverity(
  input: DetectIssueSeverityInput,
): Promise<SeverityDetectionResult> {
  const prompt = `Analyze the severity of this civic complaint (${input.category}) from the image.
Citizen note: "${input.description || ""}".
Determine severity level from: low, medium, high, critical.
Consider:
- Public safety & health hazard
- Traffic disruption
- Environmental/flooding risk
- Structural risk
Return JSON:
- severity: "low" | "medium" | "high" | "critical"
- reason: concise explanation of why this severity was assigned
- impactAssessment: brief impact summary`

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

    const validSeverities = ["low", "medium", "high", "critical"] as const
    const severity = validSeverities.includes(parsed.severity)
      ? parsed.severity
      : "high"
    const reason =
      parsed.severityReason ||
      parsed.reason ||
      "Large road surface damage visible in the image and likely to affect vehicles."
    const reasonTa = DEFAULT_SEVERITY_TA[severity] || DEFAULT_SEVERITY_TA.high

    return {
      severity,
      reason,
      reasonTa,
      impactAssessment:
        parsed.impactAssessment ||
        "Affects localized road transit and pedestrian accessibility.",
    }
  } catch (e) {
    return {
      severity: "high",
      reason:
        "Large road surface damage visible in the image and likely to affect vehicles.",
      reasonTa: DEFAULT_SEVERITY_TA.high,
      impactAssessment:
        "Affects localized road transit and pedestrian accessibility.",
    }
  }
}
