export const WORK_ORDER_STATUSES = [
  "created",
  "assigned",
  "accepted",
  "in_progress",
  "completed",
  "verified",
  "rejected",
  "reopened",
] as const

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number]

export const WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  created: ["assigned", "rejected"],
  assigned: ["accepted", "rejected", "created"],
  accepted: ["in_progress", "rejected"],
  in_progress: ["completed", "rejected"],
  completed: ["verified", "reopened", "rejected"],
  verified: ["reopened"],
  rejected: ["created", "reopened"],
  reopened: ["assigned", "rejected"],
}

export type ActorRole = "admin" | "department" | "contractor" | "officer"

const ROLE_ACTIONS: Record<string, ActorRole[]> = {
  create: ["admin", "department"],
  assign: ["admin", "department"],
  accept: ["contractor", "officer", "admin", "department"],
  start: ["contractor", "officer", "admin", "department"],
  complete: ["contractor", "officer", "admin", "department"],
  evidence: ["contractor", "officer", "admin", "department"],
  verify: ["admin", "department"],
  reject: ["admin", "department", "contractor"],
  reopen: ["admin", "department"],
}

export function canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
  return (WORK_ORDER_TRANSITIONS[from] || []).includes(to)
}

export function assertTransition(from: WorkOrderStatus, to: WorkOrderStatus): void {
  if (from === to) return
  if (!canTransition(from, to)) {
    throw new Error(`Invalid work-order transition: ${from} → ${to}`)
  }
}

export function canPerform(action: keyof typeof ROLE_ACTIONS, role: ActorRole): boolean {
  return ROLE_ACTIONS[action].includes(role)
}

export function assertRole(action: keyof typeof ROLE_ACTIONS, role: ActorRole): void {
  if (!canPerform(action, role)) {
    throw new Error(`Role '${role}' is not authorized to perform '${action}'.`)
  }
}

export function complaintStatusForWorkOrder(status: WorkOrderStatus): string | null {
  switch (status) {
    case "assigned":
    case "accepted":
      return "assigned"
    case "in_progress":
      return "in_progress"
    case "completed":
      return "verification"
    case "verified":
      return "resolved"
    case "reopened":
      return "reopened"
    case "rejected":
      return null
    default:
      return null
  }
}
