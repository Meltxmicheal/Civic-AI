import { useState, useEffect } from "react"
import { useApp } from "../contexts/AppContext.tsx"
import { t } from "../i18n/translations.ts"
import { ImageUploader } from "../components/ImageUploader.tsx"
import { LocationPicker } from "../components/LocationPicker.tsx"
import { analyzeCivicImage } from "../ai/pipeline.ts"
import { determineDepartmentRouting } from "../services/routingService.ts"
import { civicIssueService } from "../services/civicIssueService.ts"
import { generateCivicReportPDF } from "../services/pdfReportService.ts"
import { DEPARTMENTS } from "../data/civicData.ts"
import type {
  Category,
  Priority,
  CivicIssue,
  DepartmentId,
  DepartmentRoutingInfo,
} from "../types/index.ts"
import type { CombinedAIAnalysisResult, AIRequestState } from "../ai/types.ts"

interface ReportFormData {
  imageUri: string | null
  imageMimeType: "image/jpeg" | "image/png" | "image/webp"
  imageSizeBytes: number
  aiAnalysis: CombinedAIAnalysisResult | null
  category: Category
  title: string
  titleTa: string
  description: string
  descriptionTa: string
  address: string
  state: string
  district: string
  lat: number
  lng: number
  departmentId: DepartmentId
  privacy: "anonymous" | "account"
  citizenName: string
  citizenMobile: string
  routingInfo?: DepartmentRoutingInfo
}

type SubmissionState = "idle" | "submitting" | "success" | "error"

export function ReportIssuePage() {
  const { lang, navigate, userLocation } = useApp()
  const isTamil = lang === "ta"

  const [form, setForm] = useState<ReportFormData>({
    imageUri: null,
    imageMimeType: "image/jpeg",
    imageSizeBytes: 0,
    aiAnalysis: null,
    category: "road",
    title: "",
    titleTa: "",
    description: "",
    descriptionTa: "",
    address: "Anna Salai, Teynampet, Chennai",
    state: "Tamil Nadu",
    district: "Chennai",
    lat: userLocation ? userLocation.lat : 13.0382,
    lng: userLocation ? userLocation.lng : 80.2497,
    departmentId: "public-works",
    privacy: "anonymous",
    citizenName: "",
    citizenMobile: "",
  })

  // AI State
  const [aiState, setAiState] = useState<AIRequestState>("idle")
  const [aiErrorMsg, setAiErrorMsg] = useState<string>("")
  const [citizenValidationErr, setCitizenValidationErr] = useState<string>("")
  const [submitState, setSubmitState] = useState<SubmissionState>("idle")
  const [createdComplaint, setCreatedComplaint] = useState<CivicIssue | null>(null)
  const [accessPin, setAccessPin] = useState<string>("8492")

  // Analyze Image with Gemini Vision Intelligence
  const handleAnalyzeImage = async (photoUri: string, mime: string, size: number) => {
    setAiState("analyzing")
    setAiErrorMsg("")

    try {
      const response = await analyzeCivicImage({
        photoDataUri: photoUri,
        mimeType: mime,
        fileSizeBytes: size,
        description: form.description || undefined,
        locale: lang,
      })

      if (response.success && response.data) {
        const data = response.data
        const mappedCat = (data.categoryKey || "road") as Category

        // Auto-determine routing to one of 9 departments
        const routing = determineDepartmentRouting({
          category: mappedCat,
          severity: (data.severity as Priority) || "medium",
          location: {
            state: form.state,
            district: form.district,
          },
          aiSuggestedDepartment: data.suggestedDepartment,
        })

        setForm((prev) => ({
          ...prev,
          aiAnalysis: data,
          category: mappedCat,
          title: data.smartTitle || data.detectedEntity || "Reported Civic Issue",
          titleTa:
            data.smartTitleTa || data.detectedEntityTa || "பதிவு செய்யப்பட்ட குடிமைப் பிரச்சினை",
          description: data.smartDescription || prev.description,
          descriptionTa: data.smartDescriptionTa || prev.descriptionTa,
          departmentId: routing.departmentId || "public-works",
          routingInfo: routing,
        }))

        if (!data.isCivicIssue) {
          setAiState("notCivicIssue")
        } else if (data.confidence < 70) {
          setAiState("lowConfidence")
        } else {
          setAiState("success")
        }
      } else {
        setAiState(response.error?.code || "serverError")
        setAiErrorMsg(response.error?.message || "AI Analysis unavailable.")
      }
    } catch {
      setAiState("serverError")
      setAiErrorMsg("Network error occurred during AI vision analysis.")
    }
  }

  // Handle Photo Change
  const handlePhotoChange = (
    _file: File | null,
    uri: string | null,
    mime: string,
    size: number,
  ) => {
    setForm((prev) => ({
      ...prev,
      imageUri: uri,
      imageMimeType: mime as any,
      imageSizeBytes: size,
      aiAnalysis: null,
    }))
    if (uri) {
      handleAnalyzeImage(uri, mime, size)
    } else {
      setAiState("idle")
    }
  }

  // Submit Complaint to Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState === "submitting") return

    // Validate Verified Citizen Profile fields
    if (form.privacy === "account") {
      const cleanName = form.citizenName.trim()
      const cleanMobile = form.citizenMobile.replace(/\D/g, "")

      if (!cleanName || cleanName.length < 2) {
        setCitizenValidationErr(
          isTamil
            ? "சரிபார்க்கப்பட்ட குடிமகன் சுயவிவரத்திற்கு உங்கள் முழு பெயரை உள்ளிடவும்."
            : "Please enter your full name for the verified citizen profile."
        )
        return
      }

      if (!cleanMobile || cleanMobile.length !== 10) {
        setCitizenValidationErr(
          isTamil
            ? "தயவுசெய்து சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (எ.கா: 9876543210)."
            : "Please enter a valid 10-digit mobile number (e.g., 98765 43210)."
        )
        return
      }
    }
    setCitizenValidationErr("")

    setSubmitState("submitting")

    try {
      const selectedDeptObj =
        DEPARTMENTS.find((d) => d.id === form.departmentId) || DEPARTMENTS[0]
      const newIssueId =
        "CIV-2026-" + Math.random().toString(36).slice(2, 8).toUpperCase()

      const newIssue: Partial<CivicIssue> = {
        id: newIssueId,
        category: form.category,
        title: form.title || "Civic Grievance",
        titleTa: form.titleTa || "குடிமைப் பிரச்சினை",
        description:
          form.description ||
          form.aiAnalysis?.smartDescription ||
          "Civic issue reported via live portal.",
        descriptionTa:
          form.descriptionTa ||
          form.aiAnalysis?.smartDescriptionTa ||
          "நேரலை தளம் மூலம் பதிவு செய்யப்பட்ட புகார்.",
        priority: (form.aiAnalysis?.severity as Priority) || "medium",
        imageUrl: form.imageUri || undefined,
        lat: form.lat,
        lng: form.lng,
        accuracy: 10,
        address: form.address,
        country: "India",
        state: form.state,
        district: form.district,
        department: selectedDeptObj.name,
        departmentTa: selectedDeptObj.nameTa,
        departmentId: form.departmentId,
        officer: null,
        aiConfidence: form.aiAnalysis?.confidence || 92,
        aiSuggestedCategory: selectedDeptObj.category,
        aiAnalysis: form.aiAnalysis
          ? {
              detectedEntity: form.aiAnalysis.detectedEntity,
              detectedEntityTa: form.aiAnalysis.detectedEntityTa,
              severityReason: form.aiAnalysis.severityReason,
              severityReasonTa: form.aiAnalysis.severityReasonTa,
              observations: form.aiAnalysis.observations,
              observationsTa: form.aiAnalysis.observationsTa,
              analyzedAt: new Date().toISOString(),
              isCivicIssue: form.aiAnalysis.isCivicIssue,
            }
          : undefined,
        departmentRouting: form.routingInfo,
        tags: form.aiAnalysis?.tags || [
          `#${form.category}`,
          "#CivicIssue",
          "#CityBetterment",
        ],
        isFakeImage: form.aiAnalysis?.isFakeImage || false,
        fakeImageReason: form.aiAnalysis?.fakeImageReason,
        anonymous: form.privacy === "anonymous",
        citizenName:
          form.privacy === "account" ? form.citizenName.trim() : undefined,
        citizenPhone:
          form.privacy === "account"
            ? form.citizenMobile.replace(/\D/g, "")
            : undefined,
      }

      const created = await civicIssueService.createIssue(newIssue)
      setCreatedComplaint(created)
      setAccessPin(Math.floor(1000 + Math.random() * 9000).toString())
      setSubmitState("success")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch {
      setSubmitState("error")
    }
  }

  return (
    <main id="main-content" className="animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-[#1c3a6e] text-white py-8 px-4 border-b border-blue-900/40">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2">
            <span>✨</span>
            <span>
              {isTamil ? "AI பார்வை பகுப்பாய்வு இயங்குகிறது" : "Powered by Civic AI Vision"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isTamil ? "புதிய குடிமைப் புகார் பதிவு" : "Report a Civic Issue"}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-2xl">
            {isTamil
              ? "புகைப்படத்தைப் பதிவேற்றி நேரலை இருப்பிடத்துடன் சமர்ப்பிக்கவும். AI தானாகவே ஆய்வு செய்து உரிய துறைக்கு அனுப்பும்."
              : "Upload a photo and let AI automatically detect details, address, and route to the authorized department."}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {submitState === "success" && createdComplaint ? (
          /* Submission Success View */
          <div className="bg-white border border-emerald-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
              ✓
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {isTamil
                  ? "புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!"
                  : "Complaint Successfully Submitted!"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-lg mx-auto">
                {isTamil
                  ? "உங்கள் புகார் தரவுத்தளத்தில் சேமிக்கப்பட்டு வரைபடத்தில் நேரலையாகக் காட்டப்படுகிறது."
                  : "Your report is saved to the central database, routed to the department, and live on the public dashboard."}
              </p>
            </div>

            {/* Reference Card */}
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl max-w-md mx-auto text-left space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Complaint ID:</span>
                <span className="font-mono font-bold text-base text-[#1c3a6e]">
                  {createdComplaint.id}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Security PIN:</span>
                <span className="font-mono font-bold text-sm text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  {accessPin}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Department:</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]">
                  {isTamil ? createdComplaint.departmentTa : createdComplaint.department}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Location:</span>
                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                  {createdComplaint.district}, {createdComplaint.state}
                </span>
              </div>
              {/* Citizen Details */}
              {!createdComplaint.anonymous && (createdComplaint.citizenName || createdComplaint.citizenPhone) ? (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 font-semibold">
                    {isTamil ? "குடிமகன் விவரம்:" : "Citizen Profile:"}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-emerald-800 flex items-center justify-end gap-1">
                      <span>✓</span> {createdComplaint.citizenName || "Verified Citizen"}
                    </span>
                    {createdComplaint.citizenPhone && (
                      <span className="font-mono text-[11px] text-gray-500 block">
                        📱 +91 {createdComplaint.citizenPhone}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center pt-0.5">
                  <span className="text-gray-500 font-semibold">
                    {isTamil ? "சுயவிவரம்:" : "Identity Mode:"}
                  </span>
                  <span className="font-bold text-gray-700 flex items-center gap-1">
                    <span>🕶️</span> {isTamil ? "அநாமதேய சமர்ப்பிப்பு" : "Anonymous Submission"}
                  </span>
                </div>
              )}
            </div>

            {/* PDF Generation and Action Buttons */}
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => generateCivicReportPDF(createdComplaint, lang)}
                className="px-6 py-3.5 bg-[#cf6009] hover:bg-[#b55206] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>📥</span>
                <span>{isTamil ? "PDF அறிக்கையைப் பதிவிறக்குக" : "Download Official PDF Report"}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("complaint-detail", createdComplaint.id)}
                className="px-5 py-3.5 bg-[#1c3a6e] hover:bg-[#102244] text-white text-xs font-bold rounded-xl transition-all"
              >
                📄 {isTamil ? "விவரங்களைக் காண்க" : "View Dossier"}
              </button>

              <button
                type="button"
                onClick={() => navigate("map")}
                className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all"
              >
                🗺️ {isTamil ? "வரைபடத்தில் காண்க" : "View on Live Map"}
              </button>
            </div>
          </div>
        ) : (
          /* Streamlined 1-Page Fast Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Photo Upload & AI Vision */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-[#1c3a6e] text-white text-xs flex items-center justify-center font-black">
                  1
                </span>
                <span>{isTamil ? "புகைப்படம் & AI பார்வை ஆய்வு" : "Photo & AI Vision Analysis"}</span>
              </div>

              <ImageUploader
                imageUri={form.imageUri}
                isAnalyzing={aiState === "analyzing"}
                onChange={handlePhotoChange}
                onAnalyze={() => {
                  if (form.imageUri) {
                    handleAnalyzeImage(form.imageUri, form.imageMimeType, form.imageSizeBytes)
                  }
                }}
              />

              {/* AI Status Banners */}

              {aiState === "notCivicIssue" && (
                <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-xs text-red-900 flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <strong className="font-bold text-sm block text-red-800">
                      {isTamil ? "இது ஒரு குடிமைப் பிரச்சினை அல்ல!" : "Not a Valid Civic Issue"}
                    </strong>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                      {isTamil
                        ? "பதிவேற்றப்பட்ட படம் பொது உள்கட்டமைப்பு சேதத்தைக் குறிக்கவில்லை. சாலை, குப்பை, குடிநீர், தெருவிளக்கு அல்லது வடிகால் பிரச்சினையின் புகைப்படத்தைப் பதிவேற்றவும்."
                        : "The uploaded image does not show a public infrastructure problem (e.g. personal photo, selfie, pet, or food). Please upload a valid image of roads, garbage, water, lighting, or drainage issues."}
                    </p>
                  </div>
                </div>
              )}

              {aiState === "success" && form.aiAnalysis && (
                <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <span>✓</span>
                      <span>{isTamil ? "AI பகுப்பாய்வு முடிந்தது" : "AI Inspection Verified"}</span>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
                      {form.aiAnalysis.confidence}% Confidence
                    </span>
                  </div>

                  <div className="text-gray-800 font-semibold">
                    {isTamil && form.aiAnalysis.smartTitleTa
                      ? form.aiAnalysis.smartTitleTa
                      : form.aiAnalysis.smartTitle}
                  </div>

                  {form.aiAnalysis.tags && form.aiAnalysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {form.aiAnalysis.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded text-[10px] font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title & Description Fields */}
              <div className="grid gap-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isTamil ? "புகாரின் தலைப்பு" : "Report Title"}
                  </label>
                  <input
                    type="text"
                    required
                    value={isTamil ? form.titleTa || form.title : form.title}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((prev) =>
                        isTamil ? { ...prev, titleTa: val } : { ...prev, title: val },
                      )
                    }}
                    placeholder={
                      isTamil
                        ? "எ.கா., பிரதான சாலையில் உள்ள பெரிய பள்ளம்"
                        : "e.g., Large asphalt pothole near bus stop"
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e] font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isTamil ? "விளக்கம்" : "Description & Hazard Notes"}
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={isTamil ? form.descriptionTa || form.description : form.description}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((prev) =>
                        isTamil ? { ...prev, descriptionTa: val } : { ...prev, description: val },
                      )
                    }}
                    placeholder={
                      isTamil
                        ? "பிரச்சினையின் கூடுதல் விவரங்களைக் குறிப்பிடவும்..."
                        : "Describe the visible problem, landmarks, and hazards..."
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Live Browser Location */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-[#1c3a6e] text-white text-xs flex items-center justify-center font-black">
                  2
                </span>
                <span>{isTamil ? "நேரலை உலாவி இருப்பிடம்" : "Live Browser Location"}</span>
              </div>

              <LocationPicker
                address={form.address}
                state={form.state}
                district={form.district}
                lat={form.lat}
                lng={form.lng}
                onChange={(loc) => {
                  setForm((prev) => ({
                    ...prev,
                    address: loc.address,
                    state: loc.state,
                    district: loc.district,
                    lat: loc.lat,
                    lng: loc.lng,
                  }))
                }}
              />
            </div>

            {/* Section 3: Administrative Department Selector */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center justify-between text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1c3a6e] text-white text-xs flex items-center justify-center font-black">
                    3
                  </span>
                  <span>{isTamil ? "ஒதுக்கப்படும் நிர்வாகத் துறை" : "Selected Administrative Department"}</span>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  9 Departments
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = form.departmentId === dept.id
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, departmentId: dept.id }))}
                      className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#1c3a6e] bg-blue-50/60 shadow-xs"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xl">{dept.icon}</span>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-[#1c3a6e] text-white px-1.5 py-0.2 rounded-full">
                            ✓
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-gray-900 leading-tight">
                          {isTamil ? dept.nameTa : dept.name}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {dept.category}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Section 4: Privacy Profile Selection */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
                <span className="w-6 h-6 rounded-full bg-[#1c3a6e] text-white text-xs flex items-center justify-center font-black">
                  4
                </span>
                <span>{isTamil ? "சுயவிவர விருப்பத்தேர்வு" : "Identity & Privacy"}</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, privacy: "anonymous" }))
                    setCitizenValidationErr("")
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    form.privacy === "anonymous"
                      ? "border-[#1c3a6e] bg-blue-50/50 shadow-xs ring-1 ring-[#1c3a6e]/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-2xl">🕶️</span>
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      {isTamil ? "அநாமதேய சமர்ப்பிப்பு" : "Anonymous Submission"}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isTamil
                        ? "உங்கள் பெயர் மற்றும் தனிப்பட்ட தகவல்கள் மறைக்கப்படும்."
                        : "Your identity remains hidden from public reports."}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, privacy: "account" }))
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${
                    form.privacy === "account"
                      ? "border-[#1c3a6e] bg-blue-50/50 shadow-xs ring-1 ring-[#1c3a6e]/20"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-2xl">👤</span>
                  <div>
                    <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <span>{isTamil ? "குடிமகன் சுயவிவரம்" : "Verified Citizen Profile"}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                        {isTamil ? "நேரலை SMS" : "SMS Alerts"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isTamil
                        ? "நேரடி தீர்வு அறிவிப்புகளை உங்கள் பலகையில் கண்காணிக்கலாம்."
                        : "Receive real-time progress updates on your citizen dashboard."}
                    </p>
                  </div>
                </button>
              </div>

              {/* Verified Citizen Profile Details Input Form */}
              {form.privacy === "account" && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-fade-in bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                        ✓
                      </span>
                      <span className="text-xs font-extrabold text-gray-900">
                        {isTamil
                          ? "சரிபார்க்கப்பட்ட குடிமகன் தகவல்கள்"
                          : "Verified Citizen Details"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                      {isTamil ? "கட்டாய தகவல்கள்" : "Required for SMS Tracking"}
                    </span>
                  </div>

                  {citizenValidationErr && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <span className="text-base">⚠️</span>
                      <span className="font-semibold">{citizenValidationErr}</span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    {/* Citizen Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isTamil ? "முழு பெயர்" : "Full Name"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-sm">
                          👤
                        </span>
                        <input
                          type="text"
                          required={form.privacy === "account"}
                          value={form.citizenName}
                          onChange={(e) => {
                            setForm((prev) => ({ ...prev, citizenName: e.target.value }))
                            if (citizenValidationErr) setCitizenValidationErr("")
                          }}
                          placeholder={
                            isTamil ? "எ.கா. மு. கார்த்திகேயன்" : "e.g., Karthikeyan M"
                          }
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e] bg-white font-semibold placeholder:text-gray-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {/* Citizen Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {isTamil ? "மொபைல் எண்" : "Mobile Number"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex">
                        <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-700 text-xs font-bold font-mono">
                          🇮🇳 +91
                        </div>
                        <input
                          type="tel"
                          required={form.privacy === "account"}
                          maxLength={10}
                          value={form.citizenMobile}
                          onChange={(e) => {
                            const numericOnly = e.target.value.replace(/\D/g, "").slice(0, 10)
                            setForm((prev) => ({ ...prev, citizenMobile: numericOnly }))
                            if (citizenValidationErr) setCitizenValidationErr("")
                          }}
                          placeholder="98765 43210"
                          className="w-full px-3.5 py-2.5 text-xs rounded-r-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1c3a6e] bg-white font-mono font-semibold placeholder:text-gray-400 placeholder:font-normal"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-500 leading-normal">
                    <span className="text-emerald-600 text-xs mt-0.5">ℹ️</span>
                    <p>
                      {isTamil
                        ? "உங்கள் மொபைல் எண்ணிற்கு புகார் நிலை, கள அதிகாரி ஒதுக்கீடு மற்றும் நேரடி தீர்வு புகைப்பட SMS அறிவிப்புகள் அனுப்பப்படும்."
                        : "Official SMS notifications with complaint tracking ID, assigned officer details, and resolution proof will be dispatched to this number."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitState === "submitting"}
                className="w-full py-4 bg-[#1c3a6e] hover:bg-[#102244] text-white text-sm font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {submitState === "submitting" ? (
                  <>
                    <span className="animate-spin">🔄</span>
                    <span>{isTamil ? "சமர்ப்பிக்கப்படுகிறது..." : "Submitting Report..."}</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>
                      {isTamil ? "புகாரை உடனடியாக சமர்ப்பிக்கவும்" : "Submit Civic Report"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
