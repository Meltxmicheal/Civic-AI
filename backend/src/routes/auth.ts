import { Router } from "express"
import { authenticateOfficial, issueToken, verifySecret } from "../lib/auth.js"
import { envelope, fail } from "../lib/persistence.js"
import { findContractorByEmail } from "../store/opsStore.js"

export const authRouter = Router()

authRouter.post("/login", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase()
  const password = String(req.body?.password || "")
  if (!email || !password) {
    res.status(400).json(fail("Email and password are required."))
    return
  }

  // Contractor emails also use @civic.gov in the demo seed. Check them first
  // so they are not authenticated as department officials.
  const contractor = await findContractorByEmail(email)
  if (contractor && contractor.active && verifySecret(password, contractor.passwordHash)) {
    const user = {
      email: contractor.email,
      role: "contractor" as const,
      contractorId: contractor.id,
      name: contractor.name,
    }
    res.json(envelope({ data: { token: issueToken(user), user } }))
    return
  }

  const official = authenticateOfficial(email, password)
  if (official) {
    const token = issueToken(official)
    res.json(envelope({ data: { token, user: official } }))
    return
  }

  res.status(401).json(fail("Invalid credentials."))
})
