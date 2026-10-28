import { useApp } from "../contexts/AppContext"

interface CircularItem {
  id: string
  icon: string
  textEn: string
  textTa: string
  departmentEn: string
  departmentTa: string
  tag: string
}

const GOVERNMENT_CIRCULARS: CircularItem[] = [
  {
    id: "c1",
    icon: "📢",
    textEn: "Monsoon Preparedness Drive: 420+ stormwater drains desilted across all zones. Report waterlogging or blockages on CivicAI for 2-hour priority clearance.",
    textTa: "பருவமழை முன்னெச்சரிக்கை: அனைத்து மண்டலங்களிலும் 420+ மழைநீர் வடிகால்கள் தூர்வாரப்பட்டுள்ளன. நீர் தேக்கத்தை CivicAI தளத்தில் பதிவு செய்யவும்.",
    departmentEn: "Water & Drainage",
    departmentTa: "குடிநீர் & வடிகால்",
    tag: "Priority Alert",
  },
  {
    id: "c2",
    icon: "🚧",
    textEn: "PWD Night Road Resurfacing: Bitumen relaying active between 10 PM to 5 AM across main arterial roads. Please cooperate with traffic diversions.",
    textTa: "நெடுஞ்சாலை இரவு பராமரிப்பு: இரவு 10 மணி முதல் காலை 5 மணி வரை பிரதான சாலைகளில் தார் அமைக்கும் பணிகள் நடைபெறுகின்றன.",
    departmentEn: "Public Works",
    departmentTa: "பொதுப்பணித் துறை",
    tag: "Roads Notice",
  },
  {
    id: "c3",
    icon: "💧",
    textEn: "24-Hr South Trunk Pipeline Maintenance: Buffer water tankers deployed in affected wards. Dial 1913 or raise complaint on CivicAI for free delivery.",
    textTa: "குடிநீர் குழாய் சீரமைப்பு: பாதிக்கப்பட்ட வார்டுகளில் குடிநீர் டேங்கர் லாரிகள் தயார் நிலையில் உள்ளன. இலவச விநியோகத்திற்கு CivicAI-ல் பதிவு செய்யவும்.",
    departmentEn: "Water Supply",
    departmentTa: "குடிநீர் வாரியம்",
    tag: "Water Supply",
  },
  {
    id: "c4",
    icon: "💡",
    textEn: "Smart LED & Solar Streetlight Conversion: Ward 14 to 36 upgrade underway. Report flickering lights or dark stretches for instant field dispatch.",
    textTa: "ஸ்மார்ட் சோலார் தெருவிளக்கு பொருத்துதல்: பழுதடைந்த தெருவிளக்குகள் பற்றி CivicAI மூலம் உடனடி தகவல் தெரிவிக்கவும்.",
    departmentEn: "General Services",
    departmentTa: "பொது சேவைகள்",
    tag: "Utilities",
  },
  {
    id: "c5",
    icon: "🌱",
    textEn: "Green Canopy Mission: 10,000 native tree saplings planted. Request fallen branch removal or avenue tree pruning via Parks Department.",
    textTa: "பசுமை நகரம் திட்டம்: சாய்ந்த மரக்கிளைகள் அகற்ற பூங்காக்கள் மற்றும் தோட்டக்கலை பிரிவில் கோரிக்கை வைக்கவும்.",
    departmentEn: "Parks & Rec",
    departmentTa: "பூங்காக்கள் பிரிவு",
    tag: "Environment",
  },
]

export function GovernmentCircularTicker() {
  const { lang } = useApp()
  const isTamil = lang === "ta"

  return (
    <div
      className="bg-[#0c1a30] border-b border-amber-500/30 text-white overflow-hidden py-1.5 px-2 text-xs flex items-center shadow-inner relative z-30"
      aria-label="Government Circulars and Live Municipal Updates"
    >
      {/* Official Fixed Badge on Left */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded-lg font-black uppercase text-[10px] tracking-wider shrink-0 z-10 shadow-xs backdrop-blur-xs">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span>🏛️ {isTamil ? "அரசு சுற்றறிக்கை" : "Govt Circular"}</span>
      </div>

      {/* Moving Marquee Ticker Loop (from right to left continuously) */}
      <div className="overflow-hidden flex-1 relative ml-3">
        <div className="animate-marquee-loop flex items-center gap-8 whitespace-nowrap">
          {/* Loop items duplicate to make infinite seamless track */}
          {[...GOVERNMENT_CIRCULARS, ...GOVERNMENT_CIRCULARS].map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 text-gray-200">
              <span className="text-sm">{item.icon}</span>
              <span className="px-1.5 py-0.2 rounded bg-white/10 text-amber-300 font-bold text-[9px] uppercase border border-white/10">
                {isTamil ? item.departmentTa : item.departmentEn}
              </span>
              <span className={`font-semibold text-xs text-white/90 ${isTamil ? "font-tamil" : ""}`}>
                {isTamil ? item.textTa : item.textEn}
              </span>
              <span className="text-white/30 mx-2 select-none">✦</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
