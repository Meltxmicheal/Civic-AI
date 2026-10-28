import { useState, useRef, useEffect, useCallback } from "react"
import { useApp } from "../contexts/AppContext"
import { t } from "../i18n/translations"

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (photoDataUri: string) => void
}

type CameraErrorType = "permission_denied" | "not_found" | "unsupported" | "timeout" | "generic" | null

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const { lang } = useApp()
  const tr = t[lang].camera
  const common = t[lang].common

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  )
  const [loading, setLoading] = useState<boolean>(true)
  const [errorType, setErrorType] = useState<CameraErrorType>(null)
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false)

  // Clean up media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          // ignore
        }
      })
      streamRef.current = null
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(
    async (mode: "environment" | "user") => {
      stopStream()
      setLoading(true)
      setErrorType(null)
      setCapturedPhoto(null)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorType("unsupported")
        setLoading(false)
        return
      }

      try {
        // Check for available video inputs
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoInputs = devices.filter((d) => d.kind === "videoinput")
          setHasMultipleCameras(videoInputs.length > 1)
        } catch (e) {
          // ignore device enumeration error
        }

        // 10 second timeout guard
        const timeoutId = setTimeout(() => {
          if (loading) {
            setErrorType("timeout")
            setLoading(false)
            stopStream()
          }
        }, 10000)

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        clearTimeout(timeoutId)

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
        }
        setLoading(false)
      } catch (err: unknown) {
        setLoading(false)
        const error = err as { name?: string }
        if (
          error?.name === "NotAllowedError" ||
          error?.name === "PermissionDeniedError"
        ) {
          setErrorType("permission_denied")
        } else if (
          error?.name === "NotFoundError" ||
          error?.name === "DevicesNotFoundError"
        ) {
          setErrorType("not_found")
        } else {
          setErrorType("generic")
        }
      }
    },
    [stopStream],
  )

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode)
    } else {
      stopStream()
      setCapturedPhoto(null)
      setErrorType(null)
    }
    return () => {
      stopStream()
    }
  }, [isOpen, startCamera, facingMode, stopStream])

  // Keyboard shortcut support (Escape to close, Space to capture)
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      } else if (e.key === " " && !capturedPhoto && !loading && !errorType) {
        e.preventDefault()
        handleCapture()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, capturedPhoto, loading, errorType])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions matching video resolution
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720

    // Constrain max dimension to 1600px for speed & efficiency
    const maxDim = 1600
    let targetWidth = width
    let targetHeight = height
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        targetWidth = maxDim
        targetHeight = Math.round((height * maxDim) / width)
      } else {
        targetHeight = maxDim
        targetWidth = Math.round((width * maxDim) / height)
      }
    }

    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight)
    const dataUri = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedPhoto(dataUri)
  }

  const handleRetake = () => {
    setCapturedPhoto(null)
    startCamera(facingMode)
  }

  const handleUsePhoto = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto)
      handleClose()
    }
  }

  const handleFlipCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment"
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const handleClose = () => {
    stopStream()
    setCapturedPhoto(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-modal-title"
    >
      <div className="relative w-full max-w-xl bg-[#0c1a30] text-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10 max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/40 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">
              📸
            </span>
            <h2
              id="camera-modal-title"
              className={`text-sm font-semibold text-white ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {tr.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label={common.close}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] bg-black flex items-center justify-center overflow-hidden">
          {/* Error State */}
          {errorType && (
            <div className="p-6 text-center max-w-sm">
              <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h3
                className={`text-base font-bold text-white mb-2 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {errorType === "permission_denied"
                  ? tr.deniedTitle
                  : tr.unavailableTitle}
              </h3>
              <p
                className={`text-xs text-white/70 mb-5 leading-relaxed ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {errorType === "permission_denied"
                  ? tr.deniedDesc
                  : errorType === "unsupported"
                    ? tr.unsupportedDesc
                    : tr.unavailableDesc}
              </p>
              <button
                onClick={handleClose}
                className={`w-full py-2.5 px-4 bg-[#1c3a6e] hover:bg-[#254d93] text-white text-sm font-semibold rounded-lg transition-colors ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.fallbackUpload}
              </button>
            </div>
          )}

          {/* Loading Spinner */}
          {loading && !errorType && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
              <div className="w-8 h-8 border-3 border-[#1c3a6e] border-t-transparent rounded-full animate-spin mb-2" />
              <p
                className={`text-xs text-white/80 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {tr.initializing}
              </p>
            </div>
          )}

          {/* Live Video Preview */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover ${
              capturedPhoto || errorType ? "hidden" : "block"
            }`}
          />

          {/* Captured Snapshot Preview */}
          {capturedPhoto && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Captured civic issue preview"
                className="max-h-[65vh] w-auto object-contain"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-xs text-white px-2.5 py-1 rounded-md border border-white/20">
                ✓ {tr.photoCaptured}
              </div>
            </div>
          )}

          {/* Hidden Canvas for snapshot processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Flip button */}
          {!capturedPhoto && !errorType && hasMultipleCameras && (
            <button
              onClick={handleFlipCamera}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={tr.flipCamera}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8H1l4 4 4-4H6c0-3.314 2.686-6 6-6s6 2.686 6 6h-3l4 4 4-4h-3z" />
              </svg>
            </button>
          )}
        </div>

        {/* Action Controls Footer */}
        {!errorType && (
          <div className="p-4 bg-[#0c1a30] border-t border-white/10 flex items-center justify-between gap-3 flex-shrink-0">
            {!capturedPhoto ? (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className={`min-h-[44px] px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors ${
                    lang === "ta" ? "font-tamil" : ""
                  }`}
                >
                  {common.back}
                </button>
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={loading}
                  className="min-h-[48px] px-6 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 text-white rounded-full font-bold flex items-center gap-2 shadow-lg transition-transform"
                  aria-label={tr.capture}
                >
                  <div className="w-4 h-4 rounded-full bg-white animate-pulse" />
                  <span className={lang === "ta" ? "font-tamil" : ""}>
                    {tr.capture}
                  </span>
                </button>
                <div className="w-16" /> {/* spacer for visual symmetry */}
              </>
            ) : (
              <div className="w-full flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className={`min-h-[44px] flex-1 py-2.5 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-colors flex items-center justify-center gap-2 ${
                    lang === "ta" ? "font-tamil" : ""
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 4v6h6M23 20v-6h-6" />
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                  </svg>
                  {tr.retake}
                </button>
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className={`min-h-[44px] flex-1 py-2.5 px-4 rounded-lg bg-[#0a6e5f] hover:bg-[#085a4e] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    lang === "ta" ? "font-tamil" : ""
                  }`}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  {tr.usePhoto}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
