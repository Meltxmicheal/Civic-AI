import type { Category } from "../types"
import type { ReactNode } from "react"

const RoadIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12h18M3 6h18M3 18h18" />
    <path d="M12 3v18" strokeDasharray="3 3" />
  </svg>
)

const GarbageIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
)

const LightIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18h6M10 22h4M12 2v2M4.93 4.93l1.41 1.41M2 12h2M20 12h2M18.66 4.93l-1.41 1.41" />
    <path d="M12 6a6 6 0 0 1 0 12" />
    <path d="M12 6a6 6 0 0 0 0 12" />
  </svg>
)

const WaterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C6 8 4 12 4 14a8 8 0 0 0 16 0c0-2-2-6-8-12z" />
  </svg>
)

const DrainIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M8 4v16M16 4v16M2 10h20M2 14h20" />
  </svg>
)

const TrafficIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="8" y="2" width="8" height="20" rx="2" />
    <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="17" r="1.5" fill="currentColor" />
  </svg>
)

const ParkIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22V12M12 12C12 7 8 4 4 6M12 12C12 7 16 4 20 6" />
    <path d="M5 22h14" />
  </svg>
)

const BuildingIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
  </svg>
)

const OtherIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
)

const AnimalIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 5.172a2 2 0 0 0-3.414-1.414l-3.879 3.88a2 2 0 0 0 0 2.828l3.879 3.88a2 2 0 0 0 3.414-1.414" />
    <circle cx="15.5" cy="11.5" r="2.5" />
    <path d="M19 14c1.5 1 2 3 2 5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1c0-2 1-3.5 3-4.5" />
  </svg>
)

const FireIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
)

export const CATEGORY_ICONS: Record<Category, ReactNode> = {
  road: <RoadIcon />,
  garbage: <GarbageIcon />,
  streetlight: <LightIcon />,
  water: <WaterIcon />,
  drainage: <DrainIcon />,
  traffic: <TrafficIcon />,
  parks: <ParkIcon />,
  buildings: <BuildingIcon />,
  animal: <AnimalIcon />,
  fire: <FireIcon />,
  other: <OtherIcon />,
}

export const CATEGORY_COLORS: Record<Category, string> = {
  road: "#1c3a6e",
  garbage: "#0a6e5f",
  streetlight: "#b45309",
  water: "#1d4ed8",
  drainage: "#7c3aed",
  traffic: "#b91c1c",
  parks: "#15803d",
  buildings: "#64748b",
  animal: "#ea580c",
  fire: "#dc2626",
  other: "#334155",
}
