import { useState, useEffect, useCallback } from "react"
import { useApp } from "../contexts/AppContext.tsx"
import { CivicMap } from "./CivicMap.tsx"
import { searchLocationOSM, reverseGeocodeOSM } from "../services/mapService.ts"

interface LocationPickerProps {
  address: string
  state?: string
  district?: string
  lat?: number
  lng?: number
  onChange: (data: {
    address: string
    state: string
    district: string
    lat: number
    lng: number
  }) => void
}

export function LocationPicker({
  address,
  state = "Tamil Nadu",
  district = "Chennai",
  lat = 13.0382,
  lng = 80.2497,
  onChange,
}: LocationPickerProps) {
  const { lang, userLocation, setUserLocation } = useApp()
  const isTamil = lang === "ta"

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<
    Array<{
      displayName: string
      lat: number
      lng: number
    }>
  >([])
  const [searching, setSearching] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)

  // Auto-request browser location on mount if not already acquired
  const requestBrowserLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude
        const longitude = pos.coords.longitude
        const accuracy = Math.round(pos.coords.accuracy)

        setUserLocation({ lat: latitude, lng: longitude, accuracy })
        setLocationStatus("granted")

        try {
          const admin = await reverseGeocodeOSM(latitude, longitude)
          onChange({
            address: admin.formattedAddress,
            state: admin.state || "Tamil Nadu",
            district: admin.district || "Chennai",
            lat: latitude,
            lng: longitude,
          })
        } catch {
          onChange({
            address: `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            state: "Tamil Nadu",
            district: "Local District",
            lat: latitude,
            lng: longitude,
          })
        }
      },
      () => {
        setLocationStatus("denied")
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [onChange, setUserLocation])

  useEffect(() => {
    requestBrowserLocation()
  }, [requestBrowserLocation])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    const results = await searchLocationOSM(searchQuery.trim())
    setSearchResults(results)
    setSearching(false)

    if (results.length > 0) {
      handleSelectSearchResult(results[0])
    }
  }

  const handleSelectSearchResult = async (item: {
    displayName: string
    lat: number
    lng: number
  }) => {
    setSearchQuery(item.displayName)
    setSearchResults([])

    const admin = await reverseGeocodeOSM(item.lat, item.lng)
    onChange({
      address: item.displayName,
      state: admin.state || "Tamil Nadu",
      district: admin.district || "Chennai",
      lat: item.lat,
      lng: item.lng,
    })
  }

  const handleMapLocationSelect = async (coords: {
    lat: number
    lng: number
    address?: string
  }) => {
    const admin = await reverseGeocodeOSM(coords.lat, coords.lng)
    onChange({
      address: coords.address || admin.formattedAddress,
      state: admin.state || "Tamil Nadu",
      district: admin.district || "Chennai",
      lat: coords.lat,
      lng: coords.lng,
    })
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSearch(e as any)
            }
          }}
          placeholder={
            isTamil
              ? "முகவரி அல்லது பகுதி தேடுக (எ.கா. அண்ணா நகர், சென்னை)..."
              : "Search landmark, street, city (e.g. Anna Nagar, Chennai)..."
          }
          className="w-full pl-9 pr-20 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e] bg-[#f8fafc]"
        />
        <span className="absolute left-3 top-3 text-xs text-gray-400">
          🔍
        </span>
        <button
          type="button"
          onClick={(e) => handleSearch(e as any)}
          disabled={searching}
          className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-[#1c3a6e] text-white rounded-lg text-xs font-bold hover:bg-[#152e57] cursor-pointer"
        >
          {searching ? "..." : isTamil ? "தேடு" : "Search"}
        </button>
      </div>


      {/* Autocomplete Search Results */}
      {searchResults.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100 max-h-48 overflow-y-auto bg-white">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-left p-2.5 text-xs hover:bg-blue-50 transition-colors flex items-start gap-2"
            >
              <span className="text-sm shrink-0">📍</span>
              <span className="text-gray-800 font-medium line-clamp-2">
                {item.displayName}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Interactive Map */}
      <div className="rounded-2xl overflow-hidden border border-gray-300 shadow-sm">
        <CivicMap
          height="240px"
          initialCenter={[lng, lat]}
          initialZoom={14}
          enableHeatmapToggle={false}
          enableFilters={false}
          enableSearch={false}
          enableRadiusControl={false}
          interactiveLocationSelect={true}
          onLocationSelect={handleMapLocationSelect}
        />
        <div className="p-2 bg-[#f8fafc] border-t border-gray-200 text-[11px] text-gray-500 flex items-center justify-between">
          <span>
            💡{" "}
            {isTamil
              ? "வரைபடத்தில் கிளிக் செய்து சரியான இடத்தை மாற்றலாம்."
              : "Click anywhere on the map to adjust exact incident pin."}
          </span>
          <span className="font-semibold text-[#1c3a6e]">
            Live Browser Coordinates
          </span>
        </div>
      </div>

      {/* Simplified Real-Time Location Card: State, District, Lat, Lng */}
      <div className="p-4 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {isTamil ? "தானியங்கி நேரலை இருப்பிடம்" : "Auto-Detected Live Location"}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isTamil ? "நேரலை" : "Live GPS"}
          </span>
        </div>

        <div>
          <div className="text-[10px] text-gray-400 font-semibold uppercase">
            {isTamil ? "முழு முகவரி" : "Address"}
          </div>
          <div className="text-xs font-bold text-gray-900 mt-0.5 line-clamp-2">
            {address}
          </div>
        </div>

        {/* State, District, Latitude, Longitude Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-2 bg-[#f8fafc] rounded-xl border border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400">
              {isTamil ? "மாநிலம்" : "State"}
            </div>
            <div className="font-bold text-gray-800 truncate">{state}</div>
          </div>

          <div className="p-2 bg-[#f8fafc] rounded-xl border border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400">
              {isTamil ? "மாவட்டம்" : "District"}
            </div>
            <div className="font-bold text-gray-800 truncate">{district}</div>
          </div>

          <div className="p-2 bg-[#f8fafc] rounded-xl border border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400">Latitude</div>
            <div className="font-mono font-bold text-[#1c3a6e]">{lat.toFixed(5)}</div>
          </div>

          <div className="p-2 bg-[#f8fafc] rounded-xl border border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400">Longitude</div>
            <div className="font-mono font-bold text-[#1c3a6e]">{lng.toFixed(5)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
