import type { AdministrativeLocation, GeoJSONPoint } from "../types/index.ts"

export const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'
export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"

// In-memory cache for geocoding to respect Nominatim rate limits (max 1 req/sec)
const geocodeCache = new Map<string, any>()

/**
 * Searches locations using OpenStreetMap Nominatim API with fallback
 */
export async function searchLocationOSM(
  query: string,
): Promise<Array<{
  displayName: string
  lat: number
  lng: number
  type: string
  address?: any
}>> {
  const trimmed = query.trim()
  if (!trimmed || trimmed.length < 2) return []

  const cacheKey = `search_${trimmed.toLowerCase()}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      trimmed + ", India",
    )}&format=json&addressdetails=1&limit=5&countrycodes=in`

    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en, ta",
        "User-Agent": "CivicAI-Geospatial-Platform/1.0",
      },
    })

    if (res.ok) {
      const data = await res.json()
      const results = data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        type: item.type || item.class,
        address: item.address,
      }))
      geocodeCache.set(cacheKey, results)
      return results
    }
  } catch (err) {
    console.warn("Nominatim search failed, using local landmark fallback:", err)
  }

  // Fallback for key Indian landmarks & districts if network is offline
  return getLocalLandmarkFallback(trimmed)
}

/**
 * Reverse geocodes coordinates to obtain detailed administrative hierarchy (State, District, Local Body, optional Ward)
 */
export async function reverseGeocodeOSM(
  lat: number,
  lng: number,
): Promise<AdministrativeLocation> {
  const cacheKey = `rev_${lat.toFixed(4)}_${lng.toFixed(4)}`
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en, ta",
        "User-Agent": "CivicAI-Geospatial-Platform/1.0",
      },
    })

    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}

      const state = addr.state || "Tamil Nadu"
      const district =
        addr.state_district ||
        addr.district ||
        addr.city ||
        (addr.county && addr.county.includes("Taluk")
          ? addr.county.replace(/ Taluk/i, "")
          : addr.county) ||
        "Chennai"
      const localBody =
        addr.city ||
        addr.municipality ||
        addr.town ||
        addr.village ||
        addr.suburb ||
        `${district} Local Administration`
      const zone = addr.suburb || addr.neighbourhood || undefined
      // Only include ward if specifically returned in address details; never fabricate
      const ward = addr.ward ? `Ward ${addr.ward}` : undefined

      const adminLoc: AdministrativeLocation = {
        country: "India",
        state,
        district,
        localBody,
        localBodyType: determineLocalBodyType(addr),
        zone,
        ward,
        formattedAddress:
          data.display_name || `${localBody}, ${district}, ${state}, India`,
        pincode: addr.postcode,
      }

      geocodeCache.set(cacheKey, adminLoc)
      return adminLoc
    }
  } catch (err) {
    console.warn(
      "Nominatim reverse geocode error, using coordinate estimation:",
      err,
    )
  }

  // Graceful coordinate estimation fallback
  return estimateAdminLocationFromCoords(lat, lng)
}

function determineLocalBodyType(
  addr: any,
): "corporation" | "municipality" | "town_panchayat" | "village_panchayat" | "other" {
  if (
    addr.city ||
    (addr.municipality &&
      addr.municipality.toLowerCase().includes("corporation"))
  ) {
    return "corporation"
  }
  if (addr.municipality || addr.town) {
    return "municipality"
  }
  if (addr.village) {
    return "village_panchayat"
  }
  return "other"
}

function estimateAdminLocationFromCoords(
  lat: number,
  lng: number,
): AdministrativeLocation {
  // Chennai bounding approximate: 12.9 to 13.2, 80.1 to 80.3
  if (lat >= 12.9 && lat <= 13.2 && lng >= 80.1 && lng <= 80.3) {
    return {
      country: "India",
      state: "Tamil Nadu",
      district: "Chennai",
      localBody: "Greater Chennai Corporation",
      localBodyType: "corporation",
      zone: "Zone 10",
      ward: undefined, // Optional ward
      formattedAddress: `Teynampet, Chennai, Tamil Nadu, India`,
    }
  }

  // Vellore approximate: 12.8 to 13.1, 79.0 to 79.3
  if (lat >= 12.8 && lat <= 13.1 && lng >= 79.0 && lng <= 79.3) {
    return {
      country: "India",
      state: "Tamil Nadu",
      district: "Vellore",
      localBody: "Vellore City Municipal Corporation",
      localBodyType: "corporation",
      zone: "Zone 2",
      ward: undefined,
      formattedAddress: `Katpadi, Vellore, Tamil Nadu, India`,
    }
  }

  // Coimbatore approximate: 10.9 to 11.2, 76.8 to 77.1
  if (lat >= 10.9 && lat <= 11.2 && lng >= 76.8 && lng <= 77.1) {
    return {
      country: "India",
      state: "Tamil Nadu",
      district: "Coimbatore",
      localBody: "Coimbatore City Municipal Corporation",
      localBodyType: "corporation",
      zone: "East Zone",
      ward: undefined,
      formattedAddress: `Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu, India`,
    }
  }

  // Bengaluru approximate: 12.8 to 13.1, 77.4 to 77.8
  if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
    return {
      country: "India",
      state: "Karnataka",
      district: "Bengaluru Urban",
      localBody: "Bruhat Bengaluru Mahanagara Palike (BBMP)",
      localBodyType: "corporation",
      zone: "Mahadevapura",
      ward: undefined,
      formattedAddress: `Marathahalli, Bengaluru, Karnataka, India`,
    }
  }

  return {
    country: "India",
    state: "Tamil Nadu",
    district: "Local District",
    localBody: "Local Municipal Body",
    localBodyType: "municipality",
    formattedAddress: `Latitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}, India`,
  }
}

/**
 * Creates a GeoJSON Polygon representing a circle with given radius in meters.
 * Used for GPS accuracy circle and nearby-issue search radius circle.
 */
export function createCircleGeoJSON(
  centerLng: number,
  centerLat: number,
  radiusMeters: number,
  points: number = 64,
): any {
  const coords: [number, number][] = []
  const distanceX =
    radiusMeters / (111.32 * 1000 * Math.cos((centerLat * Math.PI) / 180))
  const distanceY = radiusMeters / (110.574 * 1000)

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([centerLng + x, centerLat + y])
  }
  coords.push(coords[0]) // Close the polygon loop

  return {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
    properties: {
      radius: radiusMeters,
    },
  }
}

function getLocalLandmarkFallback(q: string) {
  const ql = q.toLowerCase()
  const list = [
    {
      displayName: "Anna Salai, Teynampet, Chennai, Tamil Nadu, 600018, India",
      lat: 13.0382,
      lng: 80.2497,
      type: "highway",
    },
    {
      displayName: "Pondy Bazaar, T. Nagar, Chennai, Tamil Nadu, 600017, India",
      lat: 13.0418,
      lng: 80.234,
      type: "amenity",
    },
    {
      displayName: "Katpadi Main Road, Vellore, Tamil Nadu, 632014, India",
      lat: 12.9698,
      lng: 79.1378,
      type: "highway",
    },
    {
      displayName:
        "Vellore Golden Temple, Sripuram, Vellore, Tamil Nadu, 632055, India",
      lat: 12.8719,
      lng: 79.0888,
      type: "place_of_worship",
    },
    {
      displayName:
        "Avinashi Road, Peelamedu, Coimbatore, Tamil Nadu, 641004, India",
      lat: 11.0168,
      lng: 76.9558,
      type: "highway",
    },
    {
      displayName: "Meenakshi Amman Temple, Madurai, Tamil Nadu, 625001, India",
      lat: 9.9195,
      lng: 78.1193,
      type: "place_of_worship",
    },
    {
      displayName: "Marathahalli, Bengaluru, Karnataka, 560037, India",
      lat: 12.9569,
      lng: 77.7011,
      type: "suburb",
    },
    {
      displayName: "MG Road, Bengaluru, Karnataka, 560001, India",
      lat: 12.9756,
      lng: 77.6066,
      type: "highway",
    },
    {
      displayName: "Hitec City, Hyderabad, Telangana, 500081, India",
      lat: 17.4435,
      lng: 78.3772,
      type: "suburb",
    },
    {
      displayName: "Connaught Place, New Delhi, Delhi, 110001, India",
      lat: 28.6315,
      lng: 77.2167,
      type: "commercial",
    },
    {
      displayName: "Marine Drive, Mumbai, Maharashtra, 400020, India",
      lat: 18.9438,
      lng: 72.8232,
      type: "highway",
    },
  ]

  return list.filter((item) => item.displayName.toLowerCase().includes(ql))
}
