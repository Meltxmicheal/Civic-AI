import type { CivicIssue, Category } from "../types/index.ts"

/**
 * Sanitizes and fixes Data URIs so they render reliably across all browsers
 */
export function fixDataUri(url?: string | null): string {
  if (!url) return ""
  // Fix invalid data:image/svg+xml;utf8, header to data:image/svg+xml;charset=utf-8,
  if (url.startsWith("data:image/svg+xml;utf8,")) {
    const rawSvg = url.replace("data:image/svg+xml;utf8,", "")
    if (rawSvg.includes("%3Csvg") || rawSvg.includes("%3Crect")) {
      return `data:image/svg+xml;charset=utf-8,${rawSvg}`
    }
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`
  }
  return url
}

/**
 * Generates an SVG Data URI for an issue's BEFORE photo based on title and category
 */
export function getDefaultBeforeImage(title: string, category: Category | string): string {
  const cat = (category || "other").toLowerCase()

  let color = "#dc2626"
  let bg = "#fef2f2"
  let icon = "⚠️"
  let detailText = "Civic Damage Reported"

  if (cat.includes("road")) {
    color = "#dc2626"
    bg = "#fef2f2"
    icon = "🛣️"
    detailText = "Asphalt Damage & Cracks"
  } else if (cat.includes("garbage")) {
    color = "#d97706"
    bg = "#fffbeb"
    icon = "🗑️"
    detailText = "Overflowing Municipal Waste"
  } else if (cat.includes("streetlight") || cat.includes("light")) {
    color = "#ca8a04"
    bg = "#fefce8"
    icon = "💡"
    detailText = "Broken Lighting Fixture"
  } else if (cat.includes("water")) {
    color = "#2563eb"
    bg = "#eff6ff"
    icon = "💧"
    detailText = "Supply Pipe Leakage"
  } else if (cat.includes("drain")) {
    color = "#7c3aed"
    bg = "#f5f3ff"
    icon = "🚰"
    detailText = "Storm Drain Blockage"
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${bg}"/>
    <rect x="20" y="20" width="560" height="360" rx="16" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="8 8"/>
    <circle cx="300" cy="160" r="48" fill="${color}" fill-opacity="0.15"/>
    <text x="300" y="172" font-size="44" text-anchor="middle" font-family="system-ui, sans-serif">${icon}</text>
    <rect x="20" y="20" width="100" height="32" rx="8" fill="#dc2626"/>
    <text x="70" y="41" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">BEFORE</text>
    <text x="300" y="240" font-size="18" font-weight="bold" fill="#0f172a" text-anchor="middle" font-family="system-ui, sans-serif">${(title || "Civic Incident").slice(0, 45)}</text>
    <text x="300" y="270" font-size="13" font-weight="600" fill="${color}" text-anchor="middle" font-family="system-ui, sans-serif">${detailText}</text>
    <text x="300" y="340" font-size="11" fill="#64748b" text-anchor="middle" font-family="system-ui, sans-serif">📷 Citizen Geo-Tagged Photo Evidence</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Generates an SVG Data URI for an issue's AFTER (Resolution Proof) photo
 */
export function getDefaultAfterImage(title: string, category: Category | string, officerName?: string): string {
  const officer = officerName || "Municipal Field Officer"

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="#f0fdf4"/>
    <rect x="20" y="20" width="560" height="360" rx="16" fill="none" stroke="#16a34a" stroke-width="4"/>
    <circle cx="300" cy="150" r="50" fill="#16a34a" fill-opacity="0.15"/>
    <text x="300" y="165" font-size="48" text-anchor="middle" font-family="system-ui, sans-serif">✓</text>
    <rect x="20" y="20" width="120" height="32" rx="8" fill="#16a34a"/>
    <text x="80" y="41" font-size="12" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="system-ui, sans-serif">AFTER ✓</text>
    <text x="300" y="230" font-size="18" font-weight="bold" fill="#14532d" text-anchor="middle" font-family="system-ui, sans-serif">Resolution Completed</text>
    <text x="300" y="260" font-size="14" font-weight="600" fill="#15803d" text-anchor="middle" font-family="system-ui, sans-serif">${(title || "Civic Repair").slice(0, 40)}</text>
    <rect x="150" y="295" width="300" height="36" rx="8" fill="#dcfce7" stroke="#86efac"/>
    <text x="300" y="318" font-size="12" font-weight="700" fill="#166534" text-anchor="middle" font-family="system-ui, sans-serif">Verified by Officer ${officer}</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/**
 * Gets effective BEFORE image URL
 */
export function getBeforeImage(issue: Partial<CivicIssue>): string {
  if (issue.imageUrl && issue.imageUrl.trim().length > 10) {
    return fixDataUri(issue.imageUrl)
  }
  return getDefaultBeforeImage(issue.title || "Civic Issue", issue.category || "road")
}

/**
 * Gets effective AFTER image URL
 */
export function getAfterImage(issue: Partial<CivicIssue>): string {
  if (issue.resolvedImageUrl && issue.resolvedImageUrl.trim().length > 10) {
    return fixDataUri(issue.resolvedImageUrl)
  }
  return getDefaultAfterImage(issue.title || "Civic Issue", issue.category || "road", issue.officer || undefined)
}
