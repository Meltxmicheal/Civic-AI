import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import * as maplibregl from "maplibre-gl"
import type { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useApp } from "../contexts/AppContext.tsx"
import { civicIssueService } from "../services/civicIssueService.ts"
import {
  OSM_ATTRIBUTION,
  createCircleGeoJSON,
  searchLocationOSM,
  reverseGeocodeOSM,
} from "../services/mapService.ts"
import type {
  CivicIssue,
  Category,
  Priority,
} from "../types/index.ts"

export interface CivicMapProps {
  initialCenter?: [number, number] // [lng, lat]
  initialZoom?: number
  height?: string
  enableHeatmapToggle?: boolean
  enableFilters?: boolean
  enableSearch?: boolean
  enableRadiusControl?: boolean
  onSelectIssue?: (issue: CivicIssue) => void
  onLocationSelect?: (coords: {
    lat: number
    lng: number
    accuracy: number
    address?: string
  }) => void
  interactiveLocationSelect?: boolean
}

export const CATEGORY_CONFIG: Record<
  Category,
  {
    name: string
    nameTa: string
    color: string
    bgLight: string
    emoji: string
  }
> = {
  road: {
    name: "Roads & Potholes",
    nameTa: "சாலைகள் & குழிகள்",
    color: "#ef4444",
    bgLight: "#fee2e2",
    emoji: "🛣️",
  },
  garbage: {
    name: "Garbage & Waste",
    nameTa: "குப்பை & சுகாதாரம்",
    color: "#f59e0b",
    bgLight: "#fef3c7",
    emoji: "🗑️",
  },
  streetlight: {
    name: "Street Lighting",
    nameTa: "தெரு விளக்குகள்",
    color: "#eab308",
    bgLight: "#fef9c3",
    emoji: "💡",
  },
  water: {
    name: "Water Supply",
    nameTa: "குடிநீர் விநியோகம்",
    color: "#3b82f6",
    bgLight: "#dbeafe",
    emoji: "💧",
  },
  drainage: {
    name: "Drainage & Sewage",
    nameTa: "மழைநீர் வடிகால்",
    color: "#8b5cf6",
    bgLight: "#ede9fe",
    emoji: "🚰",
  },
  traffic: {
    name: "Traffic & Safety",
    nameTa: "போக்குவரத்து & சிக்னல்",
    color: "#ec4899",
    bgLight: "#fce7f3",
    emoji: "🚦",
  },
  parks: {
    name: "Parks & Trees",
    nameTa: "பூங்காக்கள் & மரங்கள்",
    color: "#10b981",
    bgLight: "#d1fae5",
    emoji: "🌳",
  },
  buildings: {
    name: "Public Buildings",
    nameTa: "பொதுக் கட்டிடங்கள்",
    color: "#6366f1",
    bgLight: "#e0e7ff",
    emoji: "🏢",
  },
  animal: {
    name: "Stray Animals & Cattle",
    nameTa: "தெரு விலங்குகள்",
    color: "#ea580c",
    bgLight: "#ffedd5",
    emoji: "🐕",
  },
  fire: {
    name: "Fire & Safety Hazard",
    nameTa: "தீ & பாதுகாப்பு அபாயம்",
    color: "#dc2626",
    bgLight: "#fee2e2",
    emoji: "🔥",
  },
  other: {
    name: "Other Issues",
    nameTa: "பிற பிரச்சினைகள்",
    color: "#64748b",
    bgLight: "#f1f5f9",
    emoji: "📍",
  },
}

const SEVERITY_WEIGHTS: Record<Priority, number> = {
  low: 1.5,
  medium: 3.0,
  high: 5.5,
  critical: 8.0,
}

function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000 // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function CivicMap({
  initialCenter = [80.2497, 13.0382], // Default Chennai center [lng, lat]
  initialZoom = 13,
  height = "540px",
  enableHeatmapToggle = true,
  enableFilters = true,
  enableSearch = true,
  enableRadiusControl = true,
  onSelectIssue,
  onLocationSelect,
  interactiveLocationSelect = false,
}: CivicMapProps) {
  const { lang, navigate, userLocation, setUserLocation } = useApp()
  const isTamil = lang === "ta"

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null)

  const [issues, setIssues] = useState<CivicIssue[]>([])
  const [viewMode, setViewMode] = useState<"markers" | "heatmap" | "clusters">(
    "markers",
  )
  const [filterByRadiusOnly, setFilterByRadiusOnly] = useState<boolean>(false)
  const [nearbyRadius, setNearbyRadius] = useState<number>(100) // Default 100 meters
  const [showLogosOnHeatmap, setShowLogosOnHeatmap] = useState<boolean>(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")

  // Search & Geolocation UI State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{
    displayName: string
    lat: number
    lng: number
  }>>([])
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // 1. Fetch raw issues from database service
  useEffect(() => {
    async function loadData() {
      const data = await civicIssueService.getIssues({
        category: selectedCategory,
        severity: selectedSeverity,
        status: selectedStatus,
        limit: 250,
      })
      setIssues(data)
    }
    loadData()
  }, [selectedCategory, selectedSeverity, selectedStatus])

  // 2. Active Geographic and Status Filtering (Hide resolved issues by default from map pins)
  const filteredIssues = useMemo(() => {
    // Only include unresolved issues (submitted, assigned, in_progress) unless explicitly filtered
    const activeIssues = issues.filter((issue) => {
      if (selectedStatus === "all") {
        return issue.status !== "resolved"
      }
      return issue.status === selectedStatus
    })

    if (!filterByRadiusOnly || !userLocation) {
      return activeIssues
    }

    return activeIssues.filter((issue) => {
      const dist = getDistanceInMeters(
        userLocation.lat,
        userLocation.lng,
        issue.lat,
        issue.lng,
      )
      return dist <= nearbyRadius
    })
  }, [issues, userLocation, filterByRadiusOnly, nearbyRadius, selectedStatus])


  // 3. Construct GeoJSON FeatureCollection for MapLibre sources
  const issuesGeoJSON = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: filteredIssues.map((issue) => {
        const catConfig =
          CATEGORY_CONFIG[issue.category] || CATEGORY_CONFIG.other
        const weight =
          (SEVERITY_WEIGHTS[issue.priority] || 3) *
          (1 + (issue.supportersCount || 1) * 0.12)

        return {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [issue.lng, issue.lat],
          },
          properties: {
            id: issue.id,
            title: issue.title,
            titleTa: issue.titleTa,
            category: issue.category,
            categoryName: isTamil ? catConfig.nameTa : catConfig.name,
            priority: issue.priority,
            status: issue.status,
            weight,
            reportsCount: issue.reportsCount || 1,
            supportersCount: issue.supportersCount || 1,
            upvotes: issue.upvotes || 1,
            downvotes: issue.downvotes || 0,
            department: issue.department,
            departmentTa: issue.departmentTa,
            tags: (issue.tags || []).slice(0, 3).join(" "),
            address: issue.address || "",
            imageUrl: issue.imageUrl || "",
            resolvedImageUrl: issue.resolvedImageUrl || "",
            color: catConfig.color,
            bgLight: catConfig.bgLight,
            emoji: catConfig.emoji,
          },
        }
      }),
    }
  }, [filteredIssues, isTamil])

  // 4. Request / Watch GPS Location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(
        isTamil
          ? "உங்கள் உலாவி GPS இருப்பிடத்தை ஆதரிக்கவில்லை."
          : "Geolocation is not supported by your browser.",
      )
      return
    }

    setLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const accuracy = Math.round(pos.coords.accuracy)

        setUserLocation({ lat, lng, accuracy })
        setLocating(false)

        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 15,
            essential: true,
          })
        }

        if (onLocationSelect) {
          const admin = await reverseGeocodeOSM(lat, lng)
          onLocationSelect({
            lat,
            lng,
            accuracy,
            address: admin.formattedAddress,
          })
        }
      },
      (err) => {
        setLocating(false)
        setLocationError(
          err.code === 1
            ? isTamil
              ? "இருப்பிட அனுமதி மறுக்கப்பட்டது. உலாவியில் அனுமதியை இயக்கவும்."
              : "Location permission denied. Please allow location access in your browser."
            : isTamil
              ? "இருப்பிடத்தைக் கண்டறிய முடியவில்லை."
              : "Unable to retrieve your location.",
        )
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [isTamil, setUserLocation, onLocationSelect])

  // 5. Auto-request browser location on mount
  useEffect(() => {
    if (!userLocation && typeof window !== "undefined" && navigator.geolocation) {
      requestLocation()
    }
  }, [userLocation, requestLocation])


  // Initialize MapLibre Map once on mount
  useEffect(() => {

    if (!mapContainerRef.current) return

    if (mapRef.current) {
      try {
        mapRef.current.remove()
        mapRef.current = null
      } catch (e) {}
    }

    const currentCenter: [number, number] = userLocation
      ? [userLocation.lng, userLocation.lat]
      : initialCenter

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: OSM_ATTRIBUTION,
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: currentCenter,
      zoom: initialZoom,
    })

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    )
    map.addControl(
      new maplibregl.ScaleControl({ unit: "metric" }),
      "bottom-left",
    )

    const doResize = () => {
      try {
        map.resize()
      } catch {}
    }

    const timers = [
      setTimeout(doResize, 60),
      setTimeout(doResize, 200),
      setTimeout(doResize, 500),
    ]

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        doResize()
      })
      resizeObserver.observe(mapContainerRef.current)
    }

    map.on("load", () => {
      doResize()

      // 1. Clustered Issues Source
      map.addSource("civic-issues-clustered", {
        type: "geojson",
        data: issuesGeoJSON as any,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 45,
      })

      // 2. Non-Clustered Source for Heatmap & Category Logo Pins
      map.addSource("civic-issues-unclustered", {
        type: "geojson",
        data: issuesGeoJSON as any,
      })

      // 3. User Accuracy & Radius Circle Sources
      const accGeo = userLocation
        ? createCircleGeoJSON(
            userLocation.lng,
            userLocation.lat,
            userLocation.accuracy || 15,
          )
        : { type: "FeatureCollection", features: [] }
      const radGeo = userLocation
        ? createCircleGeoJSON(userLocation.lng, userLocation.lat, nearbyRadius)
        : { type: "FeatureCollection", features: [] }

      map.addSource("user-accuracy-source", {
        type: "geojson",
        data: accGeo as any,
      })
      map.addSource("user-radius-source", {
        type: "geojson",
        data: radGeo as any,
      })

      // Accuracy Circle Layers (Blue fill & outline)
      map.addLayer({
        id: "layer-accuracy-fill",
        type: "fill",
        source: "user-accuracy-source",
        paint: {
          "fill-color": "#3b82f6",
          "fill-opacity": 0.15,
        },
      })
      map.addLayer({
        id: "layer-accuracy-line",
        type: "line",
        source: "user-accuracy-source",
        paint: {
          "line-color": "#2563eb",
          "line-width": 1.5,
          "line-dasharray": [2, 2],
        },
      })

      // 100m Radius Circle Layers (Orange perimeter with subtle glow)
      map.addLayer({
        id: "layer-radius-fill",
        type: "fill",
        source: "user-radius-source",
        paint: {
          "fill-color": "#f59e0b",
          "fill-opacity": 0.12,
        },
      })
      map.addLayer({
        id: "layer-radius-line",
        type: "line",
        source: "user-radius-source",
        paint: {
          "line-color": "#d97706",
          "line-width": 2.5,
          "line-dasharray": [3, 2],
        },
      })

      // 4. WebGL Heatmap Layer
      map.addLayer({
        id: "layer-heatmap",
        type: "heatmap",
        source: "civic-issues-unclustered",
        maxzoom: 17,
        layout: {
          visibility: "none",
        },
        paint: {
          "heatmap-weight": [
            "interpolate",
            ["linear"],
            ["get", "weight"],
            0,
            0.2,
            12,
            1.5,
          ],
          "heatmap-intensity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            1.0,
            9,
            2.2,
            15,
            4.0,
          ],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 0, 255, 0)",
            0.15,
            "rgba(34, 211, 238, 0.7)",
            0.35,
            "rgba(74, 222, 128, 0.8)",
            0.55,
            "rgba(250, 204, 21, 0.9)",
            0.75,
            "rgba(249, 115, 22, 0.95)",
            0.95,
            "rgba(239, 68, 68, 1.0)",
            1.0,
            "rgba(185, 28, 28, 1.0)",
          ],
          "heatmap-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            0,
            8,
            8,
            26,
            12,
            45,
            16,
            75,
          ],
          "heatmap-opacity": 0.88,
        },
      })

      // 5. Cluster Layers
      map.addLayer({
        id: "layer-clusters",
        type: "circle",
        source: "civic-issues-clustered",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#3b82f6",
            5,
            "#f59e0b",
            15,
            "#ef4444",
          ],
          "circle-radius": ["step", ["get", "point_count"], 20, 5, 26, 15, 34],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      })

      map.addLayer({
        id: "layer-cluster-count",
        type: "symbol",
        source: "civic-issues-clustered",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 13,
        },
        paint: {
          "text-color": "#ffffff",
        },
      })

      // 6. Category Logo Pins Layers
      // A. Outer Glow Halo
      map.addLayer({
        id: "layer-pin-halo",
        type: "circle",
        source: "civic-issues-unclustered",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 22,
          "circle-opacity": 0.25,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-opacity": 0.5,
        },
      })

      // B. Category Pin Circle Badge
      map.addLayer({
        id: "layer-pin-badge",
        type: "circle",
        source: "civic-issues-unclustered",
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 16,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      })

      // C. Category Emoji/Logo Symbol
      map.addLayer({
        id: "layer-pin-icon",
        type: "symbol",
        source: "civic-issues-unclustered",
        layout: {
          "text-field": ["get", "emoji"],
          "text-size": 16,
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-anchor": "center",
        },
      })

      // D. Issue Title Label
      map.addLayer({
        id: "layer-pin-label",
        type: "symbol",
        source: "civic-issues-unclustered",
        minzoom: 13,
        layout: {
          "text-field": isTamil
            ? ["coalesce", ["get", "titleTa"], ["get", "title"]]
            : ["get", "title"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-max-width": 12,
        },
        paint: {
          "text-color": "#0c1a30",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2.5,
        },
      })

      // Cluster Expansion Click Handler
      map.on("click", "layer-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["layer-clusters"],
        })
        if (!features[0]) return
        const clusterId = features[0].properties.cluster_id
        const source = map.getSource(
          "civic-issues-clustered",
        ) as GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          if (zoom === null || zoom === undefined) return
          const geom = features[0].geometry as any
          map.easeTo({
            center: geom.coordinates,
            zoom: zoom + 0.5,
          })
        }).catch(() => {})
      })

      // Category Pin Click Handler -> Show Interactive Popup
      const handleIssueClick = (e: any) => {
        if (!e.features || e.features.length === 0) return
        const props = e.features[0].properties as any
        const geom = e.features[0].geometry as any
        const coords = geom.coordinates.slice()

        if (popupRef.current) popupRef.current.remove()

        const titleText = isTamil && props.titleTa ? props.titleTa : props.title
        const deptText =
          isTamil && props.departmentTa ? props.departmentTa : props.department

        const popupContent = document.createElement("div")
        popupContent.className = "p-1 font-sans text-xs max-w-[260px]"
        popupContent.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <div style="font-size: 22px; line-height: 1;">${props.emoji || "📍"}</div>
            <div>
              <div style="font-weight: 700; font-size: 13px; color: #0c1a30; line-height: 1.2;">
                ${titleText}
              </div>
              <span style="font-size: 10px; font-weight: 700; color: ${props.color}; text-transform: uppercase;">
                ${props.categoryName || props.category}
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 4px; margin-bottom: 6px; flex-wrap: wrap;">
            <span style="background: #f1f5f9; color: #475569; font-weight: 600; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: capitalize;">
              ${props.status.replace("_", " ")}
            </span>
            <span style="background: #fee2e2; color: #991b1b; font-weight: 700; padding: 2px 6px; border-radius: 4px; font-size: 10px; text-transform: uppercase;">
              ${props.priority}
            </span>
          </div>

          ${
            props.status === "resolved"
              ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
                  <div style="position: relative; height: 75px; border-radius: 8px; overflow: hidden; background: #000;">
                    <img src="${props.imageUrl || props.resolvedImageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                    <span style="position: absolute; bottom: 2px; left: 2px; background: rgba(0,0,0,0.8); color: white; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px;">BEFORE</span>
                  </div>
                  <div style="position: relative; height: 75px; border-radius: 8px; overflow: hidden; background: #064e3b;">
                    <img src="${props.resolvedImageUrl || props.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                    <span style="position: absolute; bottom: 2px; left: 2px; background: #15803d; color: white; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px;">AFTER ✓</span>
                  </div>
                </div>`
              : props.imageUrl
                ? `<div style="position: relative; height: 95px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #f1f5f9;">
                    <img src="${props.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
                    <span style="position: absolute; bottom: 2px; left: 2px; background: rgba(220,38,38,0.9); color: white; font-size: 8px; font-weight: bold; padding: 1px 4px; border-radius: 3px;">BEFORE</span>
                  </div>`
                : ""
          }

          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">
            🏢 <strong>${deptText}</strong>
          </div>

          ${props.address ? `<div style="color: #64748b; font-size: 10px; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📍 ${props.address}</div>` : ""}

          <div style="display: flex; gap: 8px; color: #475569; font-size: 11px; margin-bottom: 8px; font-weight: 600; padding-top: 4px; border-top: 1px solid #f1f5f9;">
            <span>👍 ${props.upvotes || 1}</span>
            <span>👎 ${props.downvotes || 0}</span>
            <span>👥 ${props.reportsCount || 1} ${isTamil ? "அறிக்கைகள்" : "reports"}</span>
          </div>

          <button id="btn-popup-view-${props.id}" style="width: 100%; background: #1c3a6e; color: white; border: none; padding: 7px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.2s;">
            ${isTamil ? "முழு விவரங்கள் & கருத்துகள் →" : "View Details & Comments →"}
          </button>
        `

        popupRef.current = new maplibregl.Popup({
          offset: 14,
          closeButton: true,
          maxWidth: "290px",
        })
          .setLngLat(coords)
          .setDOMContent(popupContent)
          .addTo(map)

        setTimeout(() => {
          const btn = document.getElementById(`btn-popup-view-${props.id}`)
          if (btn) {
            btn.onclick = () => {
              navigate("complaint-detail", props.id)
            }
          }
        }, 50)
      }

      map.on("click", "layer-pin-badge", handleIssueClick)
      map.on("click", "layer-pin-icon", handleIssueClick)

      // Interactive location selection on map click
      if (interactiveLocationSelect) {
        map.on("click", async (e) => {
          const { lng, lat } = e.lngLat
          if (selectedMarkerRef.current) selectedMarkerRef.current.remove()
          selectedMarkerRef.current = new maplibregl.Marker({
            color: "#ef4444",
          })
            .setLngLat([lng, lat])
            .addTo(map)

          // Update 100m radius circle around clicked point
          const rGeo = createCircleGeoJSON(lng, lat, nearbyRadius)
          if (map.getSource("user-radius-source")) {
            ;(map.getSource("user-radius-source") as GeoJSONSource).setData(
              rGeo as any,
            )
          }

          if (onLocationSelect) {
            const admin = await reverseGeocodeOSM(lat, lng)
            onLocationSelect({
              lat,
              lng,
              accuracy: 10,
              address: admin.formattedAddress,
            })
          }
        })
      }

      // Pointer cursor on hover
      const setPointer = () => (map.getCanvas().style.cursor = "pointer")
      const resetPointer = () => (map.getCanvas().style.cursor = "")

      map.on("mouseenter", "layer-clusters", setPointer)
      map.on("mouseleave", "layer-clusters", resetPointer)
      map.on("mouseenter", "layer-pin-badge", setPointer)
      map.on("mouseleave", "layer-pin-badge", resetPointer)
      map.on("mouseenter", "layer-pin-icon", setPointer)
      map.on("mouseleave", "layer-pin-icon", resetPointer)
    })

    mapRef.current = map

    return () => {
      timers.forEach((t) => clearTimeout(t))
      if (resizeObserver) resizeObserver.disconnect()
      try {
        map.remove()
      } catch {}
      mapRef.current = null
    }
  }, [interactiveLocationSelect, isTamil, height])

  // 6. Update GeoJSON sources whenever filteredIssues change
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (map.getSource("civic-issues-clustered")) {
      ;(map.getSource("civic-issues-clustered") as GeoJSONSource).setData(
        issuesGeoJSON as any,
      )
    }
    if (map.getSource("civic-issues-unclustered")) {
      ;(map.getSource("civic-issues-unclustered") as GeoJSONSource).setData(
        issuesGeoJSON as any,
      )
    }
  }, [issuesGeoJSON])

  // 7. Update User Location Marker & 100m Circles dynamically
  useEffect(() => {
    if (!mapRef.current || !userLocation) return
    const map = mapRef.current

    // Update or create User Location Marker Pin
    if (!userMarkerRef.current) {
      const el = document.createElement("div")
      el.className = "civic-user-gps-marker"
      el.innerHTML = `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background: #3b82f6; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 22px; height: 22px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">
            📍
          </div>
        </div>
      `
      userMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map)
    } else {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat])
    }

    // Update Accuracy & 100m Radius GeoJSON Sources
    const accGeo = createCircleGeoJSON(
      userLocation.lng,
      userLocation.lat,
      userLocation.accuracy || 15,
    )
    const radGeo = createCircleGeoJSON(
      userLocation.lng,
      userLocation.lat,
      nearbyRadius,
    )

    if (map.getSource("user-accuracy-source")) {
      ;(map.getSource("user-accuracy-source") as GeoJSONSource).setData(
        accGeo as any,
      )
    }
    if (map.getSource("user-radius-source")) {
      ;(map.getSource("user-radius-source") as GeoJSONSource).setData(
        radGeo as any,
      )
    }
  }, [userLocation, nearbyRadius])

  // 8. Toggle Layer Visibility based on View Mode
  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    if (
      !map.getLayer("layer-heatmap") ||
      !map.getLayer("layer-clusters") ||
      !map.getLayer("layer-pin-badge") ||
      !map.getLayer("layer-pin-icon")
    ) {
      return
    }

    if (viewMode === "heatmap") {
      // Heatmap Mode
      map.setLayoutProperty("layer-heatmap", "visibility", "visible")
      map.setLayoutProperty("layer-clusters", "visibility", "none")
      map.setLayoutProperty("layer-cluster-count", "visibility", "none")

      const logoVis = showLogosOnHeatmap ? "visible" : "none"
      map.setLayoutProperty("layer-pin-halo", "visibility", logoVis)
      map.setLayoutProperty("layer-pin-badge", "visibility", logoVis)
      map.setLayoutProperty("layer-pin-icon", "visibility", logoVis)
      map.setLayoutProperty("layer-pin-label", "visibility", logoVis)
    } else if (viewMode === "clusters") {
      // Clusters Mode
      map.setLayoutProperty("layer-heatmap", "visibility", "none")
      map.setLayoutProperty("layer-clusters", "visibility", "visible")
      map.setLayoutProperty("layer-cluster-count", "visibility", "visible")
      map.setLayoutProperty("layer-pin-halo", "visibility", "none")
      map.setLayoutProperty("layer-pin-badge", "visibility", "none")
      map.setLayoutProperty("layer-pin-icon", "visibility", "none")
      map.setLayoutProperty("layer-pin-label", "visibility", "none")
    } else {
      // Category Logos Pin Mode
      map.setLayoutProperty("layer-heatmap", "visibility", "none")
      map.setLayoutProperty("layer-clusters", "visibility", "none")
      map.setLayoutProperty("layer-cluster-count", "visibility", "none")
      map.setLayoutProperty("layer-pin-halo", "visibility", "visible")
      map.setLayoutProperty("layer-pin-badge", "visibility", "visible")
      map.setLayoutProperty("layer-pin-icon", "visibility", "visible")
      map.setLayoutProperty("layer-pin-label", "visibility", "visible")
    }
  }, [viewMode, showLogosOnHeatmap])

  // Handle Search Query Submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    const res = await searchLocationOSM(searchQuery.trim())
    setSearchResults(res)
    setSearching(false)

    if (res.length > 0) {
      handleSelectSearchResult(res[0])
    }
  }

  const handleSelectSearchResult = async (item: {
    displayName: string
    lat: number
    lng: number
  }) => {
    setSearchQuery(item.displayName)
    setSearchResults([])

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.lng, item.lat],
        zoom: 15,
        essential: true,
      })
    }

    if (interactiveLocationSelect) {
      if (selectedMarkerRef.current) selectedMarkerRef.current.remove()
      if (mapRef.current) {
        selectedMarkerRef.current = new maplibregl.Marker({
          color: "#ef4444",
        })
          .setLngLat([item.lng, item.lat])
          .addTo(mapRef.current)
      }
    }

    if (onLocationSelect) {
      onLocationSelect({
        lat: item.lat,
        lng: item.lng,
        accuracy: 15,
        address: item.displayName,
      })
    }
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#d0d5e2] bg-white shadow-sm flex flex-col">
      {/* Top Map Control Bar */}
      <div className="p-3 bg-white/95 backdrop-blur-sm border-b border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2.5 z-10">
        {/* Search Bar */}
        {enableSearch && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 min-w-[220px] max-w-md"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isTamil
                  ? "தெரு, பகுதி, நகரம் தேடுக (எ.கா. காட்பாடி, வேலூர்)..."
                  : "Search locality, town, city (e.g. Katpadi, Vellore)..."
              }
              className="w-full pl-8 pr-16 py-1.5 text-xs rounded-xl border border-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-[#1c3a6e] bg-[#f8fafc]"
            />
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">
              🔍
            </span>
            <button
              type="submit"
              disabled={searching}
              className="absolute right-1.5 top-1 px-2.5 py-1 bg-[#1c3a6e] text-white rounded-lg text-xs font-semibold hover:bg-[#152e57]"
            >
              {searching ? "..." : isTamil ? "தேடு" : "Search"}
            </button>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 1 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#cbd5e1] rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#f1f5f9] border-b border-gray-100 last:border-0 truncate"
                  >
                    📍 {item.displayName}
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        {/* View Mode Switcher: Category Logos | Heatmap | Clusters */}
        {enableHeatmapToggle && (
          <div className="flex items-center gap-2">
            <div className="flex border border-[#cbd5e1] rounded-xl overflow-hidden bg-[#f8fafc] text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("markers")}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                  viewMode === "markers"
                    ? "bg-[#1c3a6e] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Show issues with various Category Logo pins"
              >
                <span>🏷️</span>
                <span>{isTamil ? "வகை லோகோக்கள்" : "Category Logos"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("heatmap")}
                className={`px-3.5 py-1.5 transition-all border-x border-[#cbd5e1] flex items-center gap-1.5 ${
                  viewMode === "heatmap"
                    ? "bg-gradient-to-r from-amber-500 to-red-600 text-white font-bold shadow-xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Show Issue Density as colorful WebGL Heatmap"
              >
                <span>🔥</span>
                <span>{isTamil ? "வெப்ப வரைபடம்" : "Heatmap"}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("clusters")}
                className={`px-3 py-1.5 transition-all flex items-center gap-1.5 ${
                  viewMode === "clusters"
                    ? "bg-[#1c3a6e] text-white shadow-xs font-bold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title="Group dense points into numeric clusters"
              >
                <span>🔵</span>
                <span>{isTamil ? "குழுக்கள்" : "Clusters"}</span>
              </button>
            </div>

            {/* Heatmap Logo Toggle */}
            {viewMode === "heatmap" && (
              <label className="hidden sm:flex items-center gap-1.5 text-xs text-gray-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={showLogosOnHeatmap}
                  onChange={(e) => setShowLogosOnHeatmap(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-amber-900">
                  {isTamil ? "லோகோக்களைக் காட்டு" : "Show Logos on Heatmap"}
                </span>
              </label>
            )}
          </div>
        )}

        {/* 100m Radius Filter Toggle & Radius Selector */}
        {enableRadiusControl && (
          <div className="flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded-xl">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={filterByRadiusOnly}
                onChange={(e) => {
                  setFilterByRadiusOnly(e.target.checked)
                  if (e.target.checked && !userLocation) {
                    requestLocation()
                  }
                }}
                className="rounded text-[#1c3a6e] focus:ring-[#1c3a6e]"
              />
              <span>{isTamil ? "ஆரம் மட்டும்:" : "Radius Filter:"}</span>
            </label>
            <select
              value={nearbyRadius}
              onChange={(e) => setNearbyRadius(Number(e.target.value))}
              className="px-1.5 py-0.5 bg-white border border-[#cbd5e1] rounded-lg font-bold text-[#1c3a6e] focus:outline-none text-[11px]"
            >
              <option value={50}>50m</option>
              <option value={100}>100m</option>
              <option value={250}>250m</option>
              <option value={500}>500m</option>
              <option value={1000}>1 km</option>
            </select>
          </div>
        )}

      </div>

      {/* Layer & Category Filters Bar with Logos */}
      {enableFilters && (
        <div className="px-3 py-2 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-semibold text-gray-500 shrink-0">
            {isTamil ? "வகை லோகோக்கள்:" : "Category Logos:"}
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 rounded-full font-semibold shrink-0 transition-all ${
              selectedCategory === "all"
                ? "bg-[#1c3a6e] text-white shadow-xs font-bold"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {isTamil ? "அனைத்தும்" : "All Issues"} ({filteredIssues.length})
          </button>
          {(
            [
              "road",
              "garbage",
              "streetlight",
              "water",
              "drainage",
              "traffic",
              "parks",
              "buildings",
            ] as Category[]
          ).map((cat) => {
            const cfg = CATEGORY_CONFIG[cat]
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat ? "all" : cat)
                }
                className={`px-3 py-1 rounded-full font-semibold shrink-0 flex items-center gap-1.5 transition-all border ${
                  isSelected
                    ? "bg-[#1c3a6e] text-white border-[#1c3a6e] shadow-xs font-bold"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-sm">{cfg.emoji}</span>
                <span>{isTamil ? cfg.nameTa : cfg.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Map Canvas Container with Explicit Dimensions */}
      <div
        className="relative w-full overflow-hidden flex-1"
        style={{ height, minHeight: height, minWidth: "100%" }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ width: "100%", height, minHeight: height }}
        />

        {/* Location Error Notice */}
        {locationError && (
          <div className="absolute top-3 left-3 right-3 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl shadow-md z-20 flex justify-between items-center">
            <span>⚠️ {locationError}</span>
            <button
              onClick={() => setLocationError(null)}
              className="font-bold text-sm"
            >
              ✕
            </button>
          </div>
        )}

        {/* 100m Radius Indicator Legend (when user location active) */}
        {userLocation && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-amber-300 shadow-md text-xs z-10 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-amber-600 bg-amber-200/50" />
            <span className="font-semibold text-amber-900">
              {isTamil
                ? `${nearbyRadius}மீ ஆரம் பகுப்பாய்வு (${filteredIssues.length} பிரச்சினைகள்)`
                : `${nearbyRadius}m Radius Detection (${filteredIssues.length} issues)`}
            </span>
          </div>
        )}

        {/* Heatmap Legend (when in heatmap mode) */}
        {viewMode === "heatmap" && (
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-gray-200 shadow-lg text-xs z-10 min-w-[200px] animate-fade-in space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-gray-900 flex items-center gap-1.5">
                <span>🔥</span>
                <span>{isTamil ? "வெப்ப அடர்த்தி" : "Heat Density"}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">WebGL</span>
            </div>

            {/* Gradient Bar */}
            <div className="h-3 rounded-full w-full bg-gradient-to-r from-cyan-400 via-yellow-400 via-orange-500 to-red-700 shadow-inner" />

            <div className="flex justify-between text-[10px] text-gray-600 font-bold">
              <span>{isTamil ? "குறைவு" : "Low"}</span>
              <span>{isTamil ? "நடுத்தரம்" : "Medium"}</span>
              <span>{isTamil ? "தீவிரம்" : "High"}</span>
              <span className="text-red-700">
                {isTamil ? "அதிதீவிரம்" : "Critical"}
              </span>
            </div>

            {/* Category Logos in Hotspots */}
            <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-500">
              <div className="font-semibold text-gray-700 mb-1">
                {isTamil ? "ஹாட்ஸ்பாட் லோகோக்கள்:" : "Hotspot Category Logos:"}
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.values(CATEGORY_CONFIG)
                  .slice(0, 6)
                  .map((cfg, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-xs"
                      title={cfg.name}
                    >
                      {cfg.emoji}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Map Status Summary Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-xs font-semibold text-[#1c3a6e] z-10 pointer-events-none flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {filteredIssues.length}{" "}
            {isTamil ? "பதிவு செய்யப்பட்ட பிரச்சினைகள்" : "Active Civic Issues"}
          </span>
        </div>
      </div>
    </div>
  )
}
