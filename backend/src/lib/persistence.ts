import mongoose from "mongoose"

export type PersistenceMode = "mongodb" | "memory"

export function getPersistenceMode(): PersistenceMode {
  return mongoose.connection.readyState === 1 ? "mongodb" : "memory"
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1
}

export function envelope<T extends Record<string, unknown>>(data: T) {
  const persistence = getPersistenceMode()
  return {
    success: true as const,
    persistence,
    persistedToDatabase: persistence === "mongodb",
    ...data,
  }
}

export function fail(statusMessage: string, extra: Record<string, unknown> = {}) {
  return {
    success: false as const,
    persistence: getPersistenceMode(),
    persistedToDatabase: false,
    message: statusMessage,
    ...extra,
  }
}
