const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:5000"

function token(): string | null {
  try {
    return localStorage.getItem("civicai_auth_token")
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// Offline Mock Fallback Engine (Active when backend is offline)
// -------------------------------------------------------------
const DEFAULT_WEIGHTS = {
  safetyRisk: 0.3,
  severity: 0.25,
  affectedPopulation: 0.2,
  recurrence: 0.15,
  roadImportance: 0.1,
}

const DEFAULT_CONTRACTORS = [
  {
    id: "CON-PWD-01",
    name: "Chennai Arterial Roads LLP",
    email: "roads.crew@civic.gov",
    department: "Roads & Infrastructure",
    workTypes: ["road", "drainage"],
    active: true,
    notes: "Demo contractor record.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "CON-WAT-02",
    name: "Metro Pipeline Services",
    email: "water.crew@civic.gov",
    department: "Water Supply & Sewerage",
    workTypes: ["water", "drainage"],
    active: true,
    notes: "Demo contractor record.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
  {
    id: "CON-ELC-03",
    name: "Nightlight Electrical Co-op",
    email: "lights.crew@civic.gov",
    department: "Electrical & Street Lighting",
    workTypes: ["streetlight", "traffic"],
    active: true,
    notes: "Demo contractor record.",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  },
]

const DEFAULT_WORK_ORDERS = [
  {
    id: "WO-2026-1001",
    complaintId: "CIV-2026-8X72KQ",
    department: "Roads & Infrastructure",
    location: "Anna Salai, Teynampet, Chennai",
    ward: "Ward 142",
    zone: "Zone 10",
    lat: 13.0382,
    lng: 80.2497,
    workDescription: "Asphalt patch and safety inspection of arterial pothole.",
    priorityScore: 82,
    contractorId: "CON-PWD-01",
    contractorName: "Chennai Arterial Roads LLP",
    estimatedCost: 185000,
    approvedCost: 178000,
    createdAt: "2026-08-08T10:00:00.000Z",
    assignedAt: "2026-08-08T10:05:00.000Z",
    startDate: "2026-08-09T08:00:00.000Z",
    dueDate: "2026-08-11T18:00:00.000Z",
    completionDate: "2026-08-11T14:32:00.000Z",
    status: "verified",
    repairNotes: "Asphalt patch completed and compacted.",
    verificationStatus: "verified",
    verifyingOfficial: "civic123@gmail.com",
    verifiedAt: "2026-08-11T16:00:00.000Z",
    slaHours: 72,
    category: "road",
    audit: [],
  },
  {
    id: "WO-2026-1002",
    complaintId: "CIV-2026-5T99ZZ",
    department: "Water Supply & Sewerage",
    location: "100 Feet Road, Gandhipuram, Coimbatore",
    ward: "Ward 45",
    zone: "East Zone",
    lat: 11.0183,
    lng: 76.9725,
    workDescription: "Drinking water pipeline leak excavation and joint replacement.",
    priorityScore: 91,
    contractorId: "CON-WAT-02",
    contractorName: "Metro Pipeline Services",
    estimatedCost: 310000,
    approvedCost: 295000,
    createdAt: "2026-08-09T08:30:00.000Z",
    assignedAt: "2026-08-09T09:00:00.000Z",
    startDate: "2026-08-09T10:00:00.000Z",
    dueDate: "2026-08-11T20:00:00.000Z",
    status: "in_progress",
    repairNotes: "Main valve isolated, pipeline weld underway.",
    slaHours: 48,
    category: "water",
    audit: [],
  },
]

function getLocalWorkOrders(): any[] {
  try {
    const raw = localStorage.getItem("civicai_fallback_work_orders")
    if (raw) return JSON.parse(raw)
  } catch {}
  return [...DEFAULT_WORK_ORDERS]
}

function saveLocalWorkOrders(orders: any[]) {
  try {
    localStorage.setItem("civicai_fallback_work_orders", JSON.stringify(orders))
  } catch {}
}

function getLocalWeights() {
  try {
    const raw = localStorage.getItem("civicai_fallback_weights")
    if (raw) return JSON.parse(raw)
  } catch {}
  return { ...DEFAULT_WEIGHTS }
}

function handleOfflineFallback<T>(path: string, init: RequestInit = {}): T {
  const method = (init.method || "GET").toUpperCase()

  // 1. Auth Login
  if (path === "/api/auth/login" && method === "POST") {
    let email = ""
    let password = ""
    try {
      const parsed = JSON.parse((init.body as string) || "{}")
      email = String(parsed.email || "").trim().toLowerCase()
      password = String(parsed.password || "").trim()
    } catch {}

    if (!email || !password) {
      throw new Error("Email and password are required.")
    }

    // Quick Credentials:
    // Admin: civic123@gmail.com / 12345
    // Contractor: roads.crew@civic.gov / pass123
    if (email === "civic123@gmail.com" && password === "12345") {
      return {
        success: true,
        persistence: "offline-demo",
        persistedToDatabase: false,
        data: {
          token: "civic-demo-admin-token-" + Date.now(),
          user: { email: "civic123@gmail.com", role: "admin", name: "Central Admin" },
        },
      } as T
    }

    if (email === "roads.crew@civic.gov" && password === "pass123") {
      return {
        success: true,
        persistence: "offline-demo",
        persistedToDatabase: false,
        data: {
          token: "civic-demo-contractor-token-" + Date.now(),
          user: {
            email: "roads.crew@civic.gov",
            role: "contractor",
            name: "Chennai Arterial Roads LLP",
            contractorId: "CON-PWD-01",
          },
        },
      } as T
    }

    if (email.endsWith("@civic.gov") && (password === "12345" || password === "pass123")) {
      const role = email.includes("officer") ? "officer" : "department"
      return {
        success: true,
        persistence: "offline-demo",
        persistedToDatabase: false,
        data: {
          token: "civic-demo-staff-token-" + Date.now(),
          user: { email, role, name: email.split("@")[0] },
        },
      } as T
    }

    throw new Error("Invalid email or password (Use: civic123@gmail.com / 12345)")
  }

  // 2. Maintenance Overview
  if (path.startsWith("/api/maintenance/overview")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: {
        totalIssues: 6,
        highPriorityCount: 4,
        criticalHazardsCount: 2,
        totalCostEstimate: 708000,
        averagePriorityScore: 78.4,
        activePlan: null,
        weights: getLocalWeights(),
      },
    } as T
  }

  // 3. Maintenance Priorities
  if (path.startsWith("/api/maintenance/priorities")) {
    const rows = [
      {
        issue: {
          id: "CIV-2026-5T99ZZ",
          title: "Drinking Water Pipe Leakage",
          category: "water",
          priority: "critical",
          status: "in_progress",
          ward: "Ward 45",
          department: "Water Supply & Sewerage",
          address: "100 Feet Road, Gandhipuram, Coimbatore",
          costEstimate: 310000,
          safetyRiskScore: 91,
          affectedPopulation: 6500,
          roadImportanceScore: 70,
        },
        score: { score: 91.2, rank: 1, breakdown: { safetyRisk: 27.3, severity: 25.0, affectedPopulation: 14.0, recurrence: 0, roadImportance: 7.0 } },
        criticalSafetyHazard: true,
      },
      {
        issue: {
          id: "CIV-2026-8X72KQ",
          title: "Large Pothole on Main Road",
          category: "road",
          priority: "high",
          status: "in_progress",
          ward: "Ward 142",
          department: "Roads & Infrastructure",
          address: "Anna Salai, Teynampet, Chennai",
          costEstimate: 185000,
          safetyRiskScore: 78,
          affectedPopulation: 4200,
          roadImportanceScore: 88,
        },
        score: { score: 82.5, rank: 2, breakdown: { safetyRisk: 23.4, severity: 20.0, affectedPopulation: 12.0, recurrence: 6.0, roadImportance: 8.8 } },
        criticalSafetyHazard: false,
      },
      {
        issue: {
          id: "CIV-2026-3C77RT",
          title: "Clogged Stormwater Drain Overflowing",
          category: "drainage",
          priority: "high",
          status: "in_progress",
          ward: "Ward 74",
          department: "Drainage & Sewerage",
          address: "Avinashi Road, Peelamedu, Coimbatore",
          costEstimate: 145000,
          safetyRiskScore: 74,
          affectedPopulation: 3100,
          roadImportanceScore: 75,
        },
        score: { score: 76.8, rank: 3, breakdown: { safetyRisk: 22.2, severity: 18.0, affectedPopulation: 10.0, recurrence: 4.5, roadImportance: 7.5 } },
        criticalSafetyHazard: false,
      },
    ]
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: rows,
    } as T
  }

  // 4. Save Weights
  if (path === "/api/maintenance/weights" && method === "PUT") {
    try {
      const parsed = JSON.parse((init.body as string) || "{}")
      localStorage.setItem("civicai_fallback_weights", JSON.stringify(parsed))
      return { success: true, persistence: "offline-demo", data: parsed } as T
    } catch {}
    return { success: true, persistence: "offline-demo", data: DEFAULT_WEIGHTS } as T
  }

  // 5. Work Orders
  if (path.startsWith("/api/work-orders")) {
    const orders = getLocalWorkOrders()

    if (method === "GET") {
      return {
        success: true,
        persistence: "offline-demo",
        persistedToDatabase: false,
        data: orders,
      } as T
    }

    if (method === "POST" && path === "/api/work-orders") {
      const parsed = JSON.parse((init.body as string) || "{}")
      const newOrder = {
        id: "WO-2026-" + Math.floor(1000 + Math.random() * 9000),
        complaintId: parsed.complaintId || "CIV-2026-MANUAL",
        department: "Roads & Infrastructure",
        location: "Designated Municipal Location",
        ward: "Ward 10",
        status: "created",
        priorityScore: 75,
        createdAt: new Date().toISOString(),
        audit: [],
      }
      orders.unshift(newOrder)
      saveLocalWorkOrders(orders)
      return { success: true, persistence: "offline-demo", data: newOrder } as T
    }

    if (path.includes("/assign")) {
      const match = path.match(/\/api\/work-orders\/([^/]+)\/assign/)
      const id = match ? match[1] : ""
      const parsed = JSON.parse((init.body as string) || "{}")
      const order = orders.find((o) => o.id === id)
      if (order) {
        order.contractorId = parsed.contractorId
        order.status = "assigned"
        saveLocalWorkOrders(orders)
      }
      return { success: true, persistence: "offline-demo", data: order } as T
    }

    if (path.includes("/status")) {
      const match = path.match(/\/api\/work-orders\/([^/]+)\/status/)
      const id = match ? match[1] : ""
      const parsed = JSON.parse((init.body as string) || "{}")
      const order = orders.find((o) => o.id === id)
      if (order) {
        order.status = parsed.status
        if (parsed.repairNotes) order.repairNotes = parsed.repairNotes
        saveLocalWorkOrders(orders)
      }
      return { success: true, persistence: "offline-demo", data: order } as T
    }

    if (path.includes("/verify")) {
      const match = path.match(/\/api\/work-orders\/([^/]+)\/verify/)
      const id = match ? match[1] : ""
      const parsed = JSON.parse((init.body as string) || "{}")
      const order = orders.find((o) => o.id === id)
      if (order) {
        order.status = parsed.decision === "rejected" ? "assigned" : "verified"
        order.verificationStatus = parsed.decision || "verified"
        order.verifiedAt = new Date().toISOString()
        saveLocalWorkOrders(orders)
      }
      return { success: true, persistence: "offline-demo", data: order } as T
    }

    if (path.includes("/evidence")) {
      const match = path.match(/\/api\/work-orders\/([^/]+)\/evidence/)
      const id = match ? match[1] : ""
      const parsed = JSON.parse((init.body as string) || "{}")
      const order = orders.find((o) => o.id === id)
      if (order) {
        order.status = "completed"
        if (parsed.afterImageUrl) order.afterImageUrl = parsed.afterImageUrl
        if (parsed.repairNotes) order.repairNotes = parsed.repairNotes
        saveLocalWorkOrders(orders)
      }
      return { success: true, persistence: "offline-demo", data: order } as T
    }
  }

  // 6. Contractors
  if (path.startsWith("/api/contractors")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: DEFAULT_CONTRACTORS,
    } as T
  }

  // 7. Intelligence Trends
  if (path.startsWith("/api/intelligence/trends")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: {
        complaintVolumeOverTime: [
          { date: "2026-08-01", count: 12 },
          { date: "2026-08-03", count: 18 },
          { date: "2026-08-05", count: 24 },
          { date: "2026-08-08", count: 31 },
          { date: "2026-08-10", count: 28 },
        ],
        resolutionTimesByDepartment: [
          { department: "Roads & Infrastructure", avgHours: 36, targetHours: 72 },
          { department: "Water Supply & Sewerage", avgHours: 18, targetHours: 24 },
          { department: "Solid Waste Management", avgHours: 12, targetHours: 24 },
          { department: "Electrical & Street Lighting", avgHours: 22, targetHours: 48 },
        ],
      },
    } as T
  }

  // 8. Intelligence Areas
  if (path.startsWith("/api/intelligence/areas")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: {
        wards: [
          { ward: "Ward 142", issueCount: 8, avgRisk: 78 },
          { ward: "Ward 45", issueCount: 5, avgRisk: 84 },
          { ward: "Ward 74", issueCount: 6, avgRisk: 69 },
        ],
        unresolvedHighPriority: [],
        recurringProblemAreas: [],
      },
    } as T
  }

  // 9. Intelligence Integrations
  if (path.startsWith("/api/intelligence/integrations")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: [
        { id: "INT-SCADA-01", name: "Metro Water SCADA Telemetry", status: "online", lastPing: new Date().toISOString() },
        { id: "INT-IOT-02", name: "Smart Lighting Mesh Network", status: "online", lastPing: new Date().toISOString() },
        { id: "INT-CCTV-03", name: "Traffic Flow Vision Sensors", status: "online", lastPing: new Date().toISOString() },
      ],
    } as T
  }

  // 10. Simulated Feeds
  if (path.startsWith("/api/intelligence/simulated-feeds")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: [
        { id: "FEED-01", type: "pressure_drop", sensor: "CMWSSB-PIPE-142", value: "0.8 bar", timestamp: new Date().toISOString() },
        { id: "FEED-02", type: "flood_level", sensor: "DRAIN-MON-74", value: "Normal (32cm)", timestamp: new Date().toISOString() },
      ],
    } as T
  }

  // 11. Recurrence scan
  if (path.startsWith("/api/intelligence/recurrence-scan")) {
    return {
      success: true,
      persistence: "offline-demo",
      persistedToDatabase: false,
      data: [],
    } as T
  }

  // Default fallback envelope
  return {
    success: true,
    persistence: "offline-demo",
    persistedToDatabase: false,
    data: {},
  } as T
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }
  const auth = token()
  if (auth) headers.Authorization = `Bearer ${auth}`

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.message || `Request failed (${res.status})`)
    }
    return body
  } catch (err: any) {
    const msg = String(err?.message || "")
    // If server responded with an actual HTTP error message (e.g. 401 Invalid credentials), respect it
    if (msg.includes("Invalid credentials") || msg.includes("Request failed (40")) {
      throw err
    }
    // If backend is offline or unreachable (e.g. "Failed to fetch" or connection refused), use high-fidelity offline fallback
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch failed") || msg.includes("ECONNREFUSED")) {
      return handleOfflineFallback<T>(path, init)
    }
    throw err
  }
}

export const opsApi = {
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: { email: string; role: string; name?: string; contractorId?: string } } }>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    ),
  overview: (params = "") => request<any>(`/api/maintenance/overview${params}`),
  priorities: (params = "") => request<any>(`/api/maintenance/priorities${params}`),
  compare: (issueIdA: string, issueIdB: string) =>
    request<any>("/api/maintenance/compare", {
      method: "POST",
      body: JSON.stringify({ issueIdA, issueIdB }),
    }),
  saveWeights: (weights: Record<string, number>) =>
    request<any>("/api/maintenance/weights", { method: "PUT", body: JSON.stringify(weights) }),
  listBudgetPlans: () => request<any>("/api/maintenance/budget-plans"),
  createBudgetPlan: (plan: Record<string, unknown>) =>
    request<any>("/api/maintenance/budget-plans", { method: "POST", body: JSON.stringify(plan) }),
  getBudgetPlan: (id: string) => request<any>(`/api/maintenance/budget-plans/${id}`),
  patchIssue: (id: string, patch: Record<string, unknown>) =>
    request<any>(`/api/maintenance/issues/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  workOrders: (params = "") => request<any>(`/api/work-orders${params}`),
  createWorkOrder: (body: Record<string, unknown>) =>
    request<any>("/api/work-orders", { method: "POST", body: JSON.stringify(body) }),
  assignWorkOrder: (id: string, contractorId: string) =>
    request<any>(`/api/work-orders/${id}/assign`, { method: "PATCH", body: JSON.stringify({ contractorId }) }),
  updateWorkOrderStatus: (id: string, status: string, extra: Record<string, unknown> = {}) =>
    request<any>(`/api/work-orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, ...extra }) }),
  submitEvidence: (id: string, body: Record<string, unknown>) =>
    request<any>(`/api/work-orders/${id}/evidence`, { method: "POST", body: JSON.stringify(body) }),
  verifyWorkOrder: (id: string, body: Record<string, unknown>) =>
    request<any>(`/api/work-orders/${id}/verify`, { method: "POST", body: JSON.stringify(body) }),
  contractors: () => request<any>("/api/contractors"),
  createContractor: (body: Record<string, unknown>) =>
    request<any>("/api/contractors", { method: "POST", body: JSON.stringify(body) }),
  contractorPerformance: (id: string) => request<any>(`/api/contractors/${id}/performance`),
  performanceReport: (params = "") => request<any>(`/api/work-orders/reports/performance${params}`),
  recurrenceScan: () => request<any>("/api/intelligence/recurrence-scan"),
  reviewRecurrence: (id: string, body: Record<string, unknown>) =>
    request<any>(`/api/work-orders/recurrence/${id}/review`, { method: "POST", body: JSON.stringify(body) }),
  trends: () => request<any>("/api/intelligence/trends"),
  areas: () => request<any>("/api/intelligence/areas"),
  integrations: () => request<any>("/api/intelligence/integrations"),
  integrationStatus: (id: string) => request<any>(`/api/intelligence/integrations/${id}/status`),
  simulatedFeeds: () => request<any>("/api/intelligence/simulated-feeds"),
}
