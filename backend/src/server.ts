import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { connectMongoDB } from "./config/db.js"
import { issuesRouter } from "./routes/issues.js"
import { authRouter } from "./routes/auth.js"
import { maintenanceRouter } from "./routes/maintenance.js"
import { workOrdersRouter } from "./routes/workOrders.js"
import { contractorsRouter } from "./routes/contractors.js"
import { intelligenceRouter } from "./routes/intelligence.js"
import { seedDatabase } from "./seed.js"
import { seedOperationalData } from "./seedOps.js"
import { getPersistenceMode } from "./lib/persistence.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({ origin: "*" }))
app.use(express.json({ limit: "25mb" }))
app.use(express.urlencoded({ extended: true, limit: "25mb" }))

// Routes
app.use("/api/issues", issuesRouter)
app.use("/api/auth", authRouter)
app.use("/api/maintenance", maintenanceRouter)
app.use("/api/work-orders", workOrdersRouter)
app.use("/api/contractors", contractorsRouter)
app.use("/api/intelligence", intelligenceRouter)

// Health Check Endpoint
app.get("/api/health", (_req, res) => {
  const persistence = getPersistenceMode()
  res.json({
    status: "ok",
    service: "Matram AI Civic Backend API",
    mongodb: persistence === "mongodb" ? "Connected" : "Unavailable",
    persistence,
    persistedToDatabase: persistence === "mongodb",
    timestamp: new Date().toISOString(),
  })
})

// Start Server and Connect DB
async function startServer() {
  const dbConnected = await connectMongoDB()
  if (dbConnected) {
    try {
      await seedDatabase(false)
    } catch (err) {
      console.warn("⚠️ Auto-seed notice:", err)
    }
  }
  try {
    await seedOperationalData()
  } catch (err) {
    console.warn("⚠️ Operational seed notice:", err)
  }

  const server = app.listen(PORT, () => {
    console.log(`🚀 Express Backend Server running on http://localhost:${PORT}`)
  })

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use. Please stop the running process or change PORT in .env`)
    } else {
      console.error("❌ Express Server Error:", err)
    }
  })
}

startServer()

