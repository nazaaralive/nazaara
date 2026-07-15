"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, Image as ImageIcon, Loader2, AlertCircle, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UploadDropzone, useUploadThing } from "@/lib/uploadthing"
import type { ClientUploadedFileData } from "uploadthing/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ImageUploadProps {
  defaultImage?: string | null
  defaultImageKey?: string | null
  name?: string
  onImageChange?: (url: string | null, key: string | null) => void
  aspectRatio?: "square" | "poster"
}

type UploadedFile = ClientUploadedFileData<{
  uploadedBy: string
  url: string
  key: string
  name: string
  size: number
}>

// ─── Square crop modal (artist / DJ photos) ─────────────────────
// Hand-rolled pan + zoom cropper: the image is shown behind a fixed square
// viewport; drag to position, slider to zoom, and the visible square is
// rendered to a canvas and uploaded. No external cropper dependency.

const VIEWPORT = 320 // on-screen crop window, px
const OUTPUT = 800   // exported square, px

interface CropModalProps {
  file: File
  uploading: boolean
  onConfirm: (cropped: File) => void
  onCancel: () => void
}

function CropModal({ file, uploading, onConfirm, onCancel }: CropModalProps) {
  const [objectUrl] = useState(() => URL.createObjectURL(file))
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null)

  useEffect(() => () => URL.revokeObjectURL(objectUrl), [objectUrl])

  const baseScale = dims ? Math.max(VIEWPORT / dims.w, VIEWPORT / dims.h) : 1
  const scale = baseScale * zoom
  const imgW = dims ? dims.w * scale : 0
  const imgH = dims ? dims.h * scale : 0

  const clamp = useCallback((x: number, y: number, w: number, h: number) => ({
    x: Math.min(0, Math.max(VIEWPORT - w, x)),
    y: Math.min(0, Math.max(VIEWPORT - h, y)),
  }), [])

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const el = e.currentTarget
    const w = el.naturalWidth, h = el.naturalHeight
    setDims({ w, h })
    // Center the image in the viewport initially
    const s = Math.max(VIEWPORT / w, VIEWPORT / h)
    setOffset({ x: (VIEWPORT - w * s) / 2, y: (VIEWPORT - h * s) / 2 })
  }

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !dims) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    setOffset(clamp(dragRef.current.baseX + dx, dragRef.current.baseY + dy, imgW, imgH))
  }
  function onPointerUp() { dragRef.current = null }

  function onZoomChange(nextZoom: number) {
    if (!dims) return
    // Keep the viewport center fixed while zooming
    const prevScale = baseScale * zoom
    const nextScale = baseScale * nextZoom
    const cx = (VIEWPORT / 2 - offset.x) / prevScale
    const cy = (VIEWPORT / 2 - offset.y) / prevScale
    const nx = VIEWPORT / 2 - cx * nextScale
    const ny = VIEWPORT / 2 - cy * nextScale
    setZoom(nextZoom)
    setOffset(clamp(nx, ny, dims.w * nextScale, dims.h * nextScale))
  }

  async function confirm() {
    if (!imgRef.current || !dims) return
    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const sx = -offset.x / scale
    const sy = -offset.y / scale
    const sSize = VIEWPORT / scale
    ctx.drawImage(imgRef.current, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT)
    canvas.toBlob(blob => {
      if (!blob) return
      const base = file.name.replace(/\.[^.]+$/, "")
      onConfirm(new File([blob], `${base}-cropped.jpg`, { type: "image/jpeg" }))
    }, "image/jpeg", 0.92)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={e => e.target === e.currentTarget && !uploading && onCancel()}>
      <div className="bg-background border border-border rounded-lg p-5 w-full max-w-sm">
        <div className="text-sm font-semibold mb-1 text-foreground">Crop photo</div>
        <p className="text-xs text-muted-foreground mb-4">Drag to reposition · use the slider to zoom. The square is what visitors will see.</p>

        <div
          className="relative mx-auto overflow-hidden rounded-md border border-border touch-none cursor-move select-none"
          style={{ width: VIEWPORT, height: VIEWPORT, maxWidth: "100%" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={objectUrl}
            alt="Crop preview"
            draggable={false}
            onLoad={onImageLoad}
            className="absolute max-w-none"
            style={{ width: imgW || "auto", height: imgH || "auto", left: offset.x, top: offset.y }}
          />
          {/* Rule-of-thirds guides */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => onZoomChange(parseFloat(e.target.value))}
            className="w-full accent-[--gold]"
            disabled={uploading}
          />
          <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button type="button" size="sm" className="bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90" onClick={confirm} disabled={uploading || !dims}>
            {uploading ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" />Uploading…</>) : "Save crop & upload"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main upload component ──────────────────────────────────────

export function ImageUpload({
  defaultImage,
  defaultImageKey,
  name = "image",
  onImageChange,
  aspectRatio = "poster"
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImage || null)
  const [imageKey, setImageKey] = useState<string | null>(defaultImageKey || null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Square-mode crop flow: file waiting in the crop modal before upload
  const [cropFile, setCropFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleUploadComplete = useCallback((res: UploadedFile[]) => {
    if (res && res[0]) {
      const file = res[0]
      setImageUrl(file.url)
      setImageKey(file.key)
      onImageChange?.(file.url, file.key)
    }
  }, [onImageChange])

  // Manual upload hook for the cropped square photos
  const { startUpload, isUploading: cropUploading } = useUploadThing("artistImage", {
    onClientUploadComplete: (res) => {
      handleUploadComplete(res as UploadedFile[])
      setCropFile(null)
    },
    onUploadError: (error: Error) => {
      setErrorMessage(error.message)
      setCropFile(null)
    },
  })

  const removeImage = useCallback(() => {
    setImageUrl(null)
    setImageKey(null)
    onImageChange?.(null, null)
  }, [onImageChange])

  const aspectClass = aspectRatio === "square" ? "aspect-square" : "aspect-[3/4]"

  function pickSquareFile(file: File | undefined | null) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please choose an image file (PNG, JPG, or WEBP).")
      return
    }
    setCropFile(file)
  }

  if (imageUrl) {
    return (
      <div className="space-y-2">
        <div className="relative group">
          <div className={cn(aspectClass, "bg-muted rounded-lg overflow-hidden")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={aspectRatio === "square" ? "Artist photo" : "Event poster"}
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>

        {/* Hidden inputs to maintain the image data for form submission */}
        <input type="hidden" name={name} value={imageUrl || ""} />
        <input type="hidden" name={`${name}Key`} value={imageKey || ""} />
      </div>
    )
  }

  // ── Square mode: custom picker → crop modal → manual upload ──
  if (aspectRatio === "square") {
    return (
      <div className="space-y-2">
        <div
          className={cn(
            "aspect-square border-2 border-dashed rounded-lg transition-all",
            "flex flex-col items-center justify-center cursor-pointer",
            "hover:border-[--gold]/50 hover:bg-muted/50",
            dragOver ? "border-[--gold] bg-[--gold]/10" : "border-muted-foreground/20 bg-muted/30"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); pickSquareFile(e.dataTransfer.files?.[0]) }}
        >
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground mb-1">Drop image here or click to upload</p>
          <p className="text-xs text-muted-foreground">You&apos;ll crop it before it uploads · PNG, JPG, WEBP up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { pickSquareFile(e.target.files?.[0]); e.target.value = "" }}
          />
        </div>

        {cropFile && (
          <CropModal
            file={cropFile}
            uploading={cropUploading}
            onConfirm={f => startUpload([f])}
            onCancel={() => setCropFile(null)}
          />
        )}

        {/* Hidden inputs for form submission */}
        <input type="hidden" name={name} value={imageUrl || ""} />
        <input type="hidden" name={`${name}Key`} value={imageKey || ""} />

        <AlertDialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <AlertDialogTitle>Upload Failed</AlertDialogTitle>
              </div>
              <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setErrorMessage(null)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // ── Poster mode: original UploadThing dropzone flow (unchanged) ──
  return (
    <div className="space-y-2">
      <UploadDropzone
        endpoint="eventPoster"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={(error: Error) => {
          console.error("Upload error:", error)
          setIsUploading(false)
          setErrorMessage(error.message)
        }}
        onUploadBegin={() => {
          setIsUploading(true)
        }}
        onUploadProgress={() => {
          // Could add progress tracking here if needed
        }}
        config={{
          mode: "auto"
        }}
        appearance={{
          container: cn(
            aspectClass, "border-2 border-dashed rounded-lg transition-all",
            "flex flex-col items-center justify-center cursor-pointer",
            "hover:border-muted-foreground/50 hover:bg-muted/50",
            "border-muted-foreground/20 bg-muted/30",
            "ut-uploading:border-[--gold] ut-uploading:bg-[--gold]/10",
            "ut-ready:hover:border-[--gold]/50"
          ),
          uploadIcon: "hidden",
          label: "hidden",
          allowedContent: "hidden",
          button: cn(
            "hidden" // We'll use our custom UI instead
          ),
        }}
        content={{
          uploadIcon() {
            if (isUploading) {
              return <Loader2 className="h-12 w-12 mx-auto mb-3 text-[--gold] animate-spin" />
            }
            return <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          },
          label() {
            if (isUploading) {
              return (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Uploading...</p>
                  <p className="text-xs text-muted-foreground mt-1">Please wait</p>
                </div>
              )
            }
            return (
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop image here or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 10MB
                </p>
              </div>
            )
          },
          allowedContent() {
            return null // Hidden via appearance
          },
          button() {
            return null // Hidden via appearance
          }
        }}
      />

      {/* Hidden inputs for form submission */}
      <input type="hidden" name={name} value={imageUrl || ""} />
      <input type="hidden" name={`${name}Key`} value={imageKey || ""} />

      {/* Error Dialog */}
      <AlertDialog open={!!errorMessage} onOpenChange={(open) => !open && setErrorMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDialogTitle>Upload Failed</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorMessage(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
