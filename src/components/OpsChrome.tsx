export function PersistenceNotice({
  persistence,
  persistedToDatabase,
}: {
  persistence?: string
  persistedToDatabase?: boolean
}) {
  if (!persistence) return null
  const durable = persistedToDatabase === true
  return (
    <div
      className={`text-xs rounded-xl border px-3 py-2 ${
        durable
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-amber-50 border-amber-200 text-amber-800"
      }`}
    >
      {durable
        ? "Records are persisted to MongoDB."
        : "Fallback in-memory store is active. Writes are not durable database persistence."}
    </div>
  )
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "Unavailable"
  return `₹${Number(value).toLocaleString("en-IN")}`
}

export function scoreLabel(value: number | null | undefined, incomplete?: boolean): string {
  if (value === null || value === undefined) return "Unavailable"
  return `${Number(value).toFixed(1)}${incomplete ? " (incomplete)" : ""}`
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
