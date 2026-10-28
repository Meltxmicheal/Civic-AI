import { runGeminiVisionModel } from "../genkit.ts"

export interface ChatInput {
  message: string
  locale: "en" | "ta"
  history?: Array<{ role: "user" | "bot"; text: string }>
}

export interface ChatOutput {
  reply: string
  suggestedAction?: "report" | "track" | "map"
}

/**
 * Multilingual civic assistant flow supporting English, Tamil, and Tanglish
 */
export async function runCivicChatFlow(input: ChatInput): Promise<ChatOutput> {
  const prompt = `You are CivicAI Assistant for Chennai Municipal Corporation.
Citizen message: "${input.message}".
Citizen locale: "${input.locale}".
Help the citizen with reporting issues, tracking complaints, SLA timelines, or finding municipal contacts.
Keep responses helpful, friendly, and under 3 sentences.`

  try {
    const reply = await runGeminiVisionModel({ prompt })
    return {
      reply:
        reply ||
        (input.locale === "ta"
          ? "வணக்கம்! உங்களுக்கு எவ்வாறு உதவலாம்?"
          : "Hello! How can I assist you with civic services today?"),
    }
  } catch (e) {
    return {
      reply:
        input.locale === "ta"
          ? "வணக்கம்! உங்கள் புகாரைப் பதிவு செய்ய அல்லது கண்காணிக்க நான் உதவ முடியும்."
          : "Hello! I can help you report an issue or track an existing complaint.",
    }
  }
}
