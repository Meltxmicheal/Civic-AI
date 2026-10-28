import { useState, useRef, ChangeEvent, DragEvent } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"
import { CameraCaptureModal } from "./CameraCaptureModal"

interface ImageUploaderProps {
  imageUri: string | null
  onImageSelected?: (
    dataUri: string,
    fileSizeBytes: number,
    mimeType: "image/jpeg" | "image/png" | "image/webp",
  ) => void
  onImageRemoved?: () => void
  onChange?: (
    file: File | null,
    dataUri: string,
    mimeType: string,
    fileSizeBytes: number,
  ) => void
  onRemove?: () => void
  onAnalyze?: () => void
  isAnalyzing?: boolean
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]

export function ImageUploader({
  imageUri,
  onImageSelected,
  onImageRemoved,
  onChange,
  onRemove,
  onAnalyze,
  isAnalyzing = false,
}: ImageUploaderProps) {
  const { lang } = useApp()
  const tr = t[lang].uploader
  const common = t[lang].common

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const notifySelected = (
    dataUri: string,
    fileSizeBytes: number,
    mimeType: "image/jpeg" | "image/png" | "image/webp",
    file?: File | null,
  ) => {
    if (typeof onImageSelected === "function") {
      onImageSelected(dataUri, fileSizeBytes, mimeType)
    }
    if (typeof onChange === "function") {
      onChange(file || null, dataUri, mimeType, fileSizeBytes)
    }
  }

  const notifyRemoved = () => {
    if (typeof onImageRemoved === "function") {
      onImageRemoved()
    }
    if (typeof onRemove === "function") {
      onRemove()
    }
    if (typeof onChange === "function") {
      onChange(null, "", "", 0)
    }
  }

  // Compress & strip EXIF metadata using Canvas
  const processImageFile = async (file: File) => {
    setValidationError(null)

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setValidationError(tr.invalidFormatError)
      return
    }

    // Validate Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(tr.fileTooLargeError)
      return
    }

    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Image dimension validation & compression via Canvas
      const img = new Image()
      img.onload = () => {
        const maxDim = 1600
        let targetWidth = img.width
        let targetHeight = img.height

        if (img.width < 50 || img.height < 50) {
          setValidationError(tr.imageTooSmallError)
          return
        }

        if (img.width > maxDim || img.height > maxDim) {
          if (img.width > img.height) {
            targetWidth = maxDim
            targetHeight = Math.round((img.height * maxDim) / img.width)
          } else {
            targetHeight = maxDim
            targetWidth = Math.round((img.width * maxDim) / img.height)
          }
        }

        const canvas = document.createElement("canvas")
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          notifySelected(dataUri, file.size, file.type as "image/jpeg", file)
          return
        }

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
        const mime = file.type === "image/png" ? "image/png" : "image/jpeg"
        const compressedUri = canvas.toDataURL(mime, 0.85)

        notifySelected(
          compressedUri,
          Math.round(compressedUri.length * 0.75),
          mime as "image/jpeg",
          file,
        )
      }
      img.onerror = () => {
        setValidationError(tr.invalidFormatError)
      }
      img.src = dataUri
    } catch (e) {
      setValidationError(tr.invalidFormatError)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      processImageFile(files[0])
    }
    // Reset file input value so same file can be re-selected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0])
    }
  }

  const handleCameraCapture = (photoUri: string) => {
    notifySelected(photoUri, Math.round(photoUri.length * 0.75), "image/jpeg", null)
  }

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        id="civic-image-file-input"
        aria-label={tr.uploadImage}
      />

      {/* Validation Error Alert */}
      {validationError && (
        <div
          role="alert"
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700 animate-fade-in"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className={`flex-1 ${lang === "ta" ? "font-tamil" : ""}`}>
            {validationError}
          </span>
          <button
            onClick={() => setValidationError(null)}
            className="text-red-500 hover:text-red-800 font-bold"
            aria-label={common.close}
          >
            ✕
          </button>
        </div>
      )}

      {/* State 1: No Image Selected Yet */}
      {!imageUri ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
            dragActive
              ? "border-[#1c3a6e] bg-[#e8eef8]"
              : "border-[#d0d5e2] bg-[#f8fafc] hover:border-[#1c3a6e]/50 hover:bg-[#f1f5f9]"
          }`}
        >
          <div className="w-16 h-16 bg-[#e8eef8] text-[#1c3a6e] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>

          <h3
            className={`text-base font-bold text-[#0c1a30] mb-1 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.selectPhotoPrompt}
          </h3>
          <p
            className={`text-xs text-[#64748b] mb-6 max-w-md mx-auto leading-relaxed ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.aiAnalyzeNote}
          </p>

          {/* Primary Action Buttons: Upload & Capture */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full sm:w-1/2 min-h-[48px] px-5 py-3 bg-[#1c3a6e] hover:bg-[#102244] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>{tr.uploadImage}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className={`w-full sm:w-1/2 min-h-[48px] px-5 py-3 bg-[#0a6e5f] hover:bg-[#085a4e] text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{tr.captureImage}</span>
            </button>
          </div>

          <p
            className={`text-[11px] text-[#94a3b8] mt-4 ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {tr.supportedFormats}
          </p>
        </div>
      ) : (
        /* State 2: Image Preview & Analyze Action */
        <div className="bg-white border border-[#d0d5e2] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span
              className={`text-xs font-semibold text-[#0a6e5f] bg-[#e0f4f1] px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {tr.imageReady}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                className={`text-xs px-2.5 py-1 text-[#1c3a6e] hover:bg-[#e8eef8] rounded-md border border-[#d0d5e2] transition-colors disabled:opacity-50 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.replaceImage}
              </button>
              <button
                type="button"
                onClick={notifyRemoved}
                disabled={isAnalyzing}
                className={`text-xs px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-md border border-red-200 transition-colors disabled:opacity-50 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
                aria-label={common.removeFile}
              >
                {tr.removeImage}
              </button>
            </div>
          </div>

          {/* High-res Image Preview */}
          <div className="relative w-full aspect-video max-h-[340px] bg-slate-950 rounded-xl overflow-hidden mb-4 border border-[#d0d5e2] flex items-center justify-center">
            <img
              src={imageUri}
              alt="Civic issue report preview"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Analyze Action Banner */}
          <div className="bg-[#f8fafc] border border-[#d0d5e2] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <p
                className={`text-xs font-semibold text-[#0c1a30] ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.analyzePromptTitle}
              </p>
              <p
                className={`text-[11px] text-[#64748b] ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.analyzePromptDesc}
              </p>
            </div>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className={`w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[#1c3a6e] hover:bg-[#102244] text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tr.analyzing}</span>
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  <span>{tr.analyzeWithCivicAI}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  )
}
