"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import type { PublicGalleryImage } from "@/lib/public-actions"
import { cn } from "@/lib/utils"

interface GalleryImageViewerProps {
  images: PublicGalleryImage[]
  title: string
}

const COLUMN_COUNT = 3

export function GalleryImageViewer({ images, title }: GalleryImageViewerProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [lightboxImageLoading, setLightboxImageLoading] = useState(false)

  // Track which images are "near" the viewport and should be rendered.
  // This set is BIDIRECTIONAL — images are added when they enter the
  // rootMargin zone and REMOVED when they leave it, so the DOM never
  // holds more than ~40-60 images at a time regardless of gallery size.
  const [visibleSet, setVisibleSet] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    for (let i = 0; i < Math.min(15, images.length); i++) initial.add(i)
    return initial
  })

  // Distribute images into columns for masonry layout
  // Round-robin assignment keeps columns balanced
  const columns = useMemo(() => {
    const cols: { image: PublicGalleryImage; originalIndex: number }[][] = Array.from(
      { length: COLUMN_COUNT },
      () => []
    )
    images.forEach((image, index) => {
      cols[index % COLUMN_COUNT].push({ image, originalIndex: index })
    })
    return cols
  }, [images])

  // Intersection observer with a generous rootMargin so images load
  // well before the user scrolls to them (Adobe Portfolio-style).
  // Updates are throttled via requestAnimationFrame to prevent
  // hundreds of re-renders during aggressive scrolling.
  const observerRef = useRef<IntersectionObserver | null>(null)
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map())
  const pendingAdds = useRef<Set<number>>(new Set())
  const pendingRemoves = useRef<Set<number>>(new Set())
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const flushUpdates = () => {
      rafId.current = null
      const adds = pendingAdds.current
      const removes = pendingRemoves.current
      if (adds.size === 0 && removes.size === 0) return

      // Capture and clear
      const toAdd = new Set(adds)
      const toRemove = new Set(removes)
      adds.clear()
      removes.clear()

      setVisibleSet((prev) => {
        const next = new Set(prev)
        toRemove.forEach((i) => next.delete(i))
        toAdd.forEach((i) => next.add(i))
        return next
      })
    }

    const scheduleFlush = () => {
      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(flushUpdates)
      }
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-index"))
          if (isNaN(idx)) return
          if (entry.isIntersecting) {
            pendingRemoves.current.delete(idx)
            pendingAdds.current.add(idx)
          } else {
            pendingAdds.current.delete(idx)
            pendingRemoves.current.add(idx)
          }
        })
        scheduleFlush()
      },
      {
        // Load images when they're within 2000px of the viewport —
        // gives the browser plenty of time to fetch before the user sees them.
        // Images are also REMOVED from the DOM once they leave this zone,
        // keeping memory usage bounded.
        rootMargin: "2000px 0px",
        threshold: 0,
      }
    )

    itemRefs.current.forEach((el) => observerRef.current?.observe(el))
    return () => {
      observerRef.current?.disconnect()
      if (rafId.current !== null) cancelAnimationFrame(rafId.current)
    }
  }, [images.length])

  const setItemRef = useCallback((el: HTMLElement | null, index: number) => {
    if (el) {
      itemRefs.current.set(index, el)
      observerRef.current?.observe(el)
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImageIndex === null) return
      switch (e.key) {
        case "Escape":
          setSelectedImageIndex(null)
          break
        case "ArrowLeft":
          navigatePrevious()
          break
        case "ArrowRight":
          navigateNext()
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImageIndex])

  const navigatePrevious = useCallback(() => {
    if (selectedImageIndex === null) return
    setLightboxImageLoading(true)
    setSelectedImageIndex(
      selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1
    )
  }, [selectedImageIndex, images.length])

  const navigateNext = useCallback(() => {
    if (selectedImageIndex === null) return
    setLightboxImageLoading(true)
    setSelectedImageIndex(
      selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1
    )
  }, [selectedImageIndex, images.length])

  // Compute indices to preload around the current lightbox image
  // 3 ahead + 2 behind so swiping in either direction feels instant
  const preloadIndices = useMemo(() => {
    if (selectedImageIndex === null) return []
    const indices: number[] = []
    for (let offset = -2; offset <= 3; offset++) {
      if (offset === 0) continue // current image rendered separately
      let idx = selectedImageIndex + offset
      if (idx < 0) idx += images.length
      if (idx >= images.length) idx -= images.length
      indices.push(idx)
    }
    return indices
  }, [selectedImageIndex, images.length])

  // Track which lightbox images have finished loading (low-quality preview)
  const [loadedLightboxImages, setLoadedLightboxImages] = useState<Set<number>>(new Set())
  // Track which images have their full-res original ready
  const [fullResReady, setFullResReady] = useState<Set<number>>(new Set())

  // When the selected image changes, check if it's already cached
  useEffect(() => {
    if (selectedImageIndex !== null && loadedLightboxImages.has(selectedImageIndex)) {
      setLightboxImageLoading(false)
    }
  }, [selectedImageIndex, loadedLightboxImages])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedImageIndex !== null) {
      document.body.style.overflow = "hidden"
      setLightboxImageLoading(true)
    } else {
      document.body.style.overflow = ""
      setLightboxImageLoading(false)
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [selectedImageIndex])

  // Touch swipe support for mobile lightbox
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return
      const diff = e.changedTouches[0].clientX - touchStartX.current
      if (Math.abs(diff) > 60) {
        if (diff > 0) navigatePrevious()
        else navigateNext()
      }
      touchStartX.current = null
    },
    [navigatePrevious, navigateNext]
  )

  return (
    <>
      {/* Masonry Grid — 3 columns on all screen sizes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
        {columns.map((column, colIndex) => (
          <div key={colIndex} className="flex flex-col gap-2 sm:gap-4 lg:gap-6">
            {column.map(({ image, originalIndex }) => (
              <div
                key={image.id}
                ref={(el) => setItemRef(el, originalIndex)}
                data-index={originalIndex}
                style={{ contentVisibility: "auto", containIntrinsicSize: "0 250px" }}
              >
                <button
                  onClick={() => {
                    setLightboxImageLoading(true)
                    setSelectedImageIndex(originalIndex)
                  }}
                  className="group relative w-full overflow-hidden rounded-sm sm:rounded-lg bg-muted transition-shadow duration-300 hover:shadow-2xl"
                  aria-label={`View image ${originalIndex + 1}`}
                >
                  {visibleSet.has(originalIndex) ? (
                    <Image
                      src={image.url}
                      alt={image.caption || `${title} - Image ${originalIndex + 1}`}
                      width={800}
                      height={1200}
                      className="w-full h-auto object-cover transition-all duration-500 ease-out opacity-0 group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 33vw"
                      quality={65}
                      loading="lazy"
                      onLoad={(e) => {
                        const img = e.currentTarget as HTMLImageElement
                        img.style.opacity = "1"
                      }}
                    />
                  ) : (
                    /* Placeholder skeleton for images not yet near viewport */
                    <div className="w-full aspect-[3/4] bg-gradient-to-b from-muted via-muted/60 to-muted animate-pulse" />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={() => setSelectedImageIndex(null)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedImageIndex(null)
            }}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigatePrevious()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
            <span className="text-white/80 text-sm font-light tracking-wide">
              {selectedImageIndex + 1} / {images.length}
            </span>
          </div>

          {/* Main image + hidden preloaded neighbours */}
          <div
            className="absolute inset-0 flex items-center justify-center p-4 pt-16 pb-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              {/* Loading spinner — only while low-quality preview hasn't loaded yet */}
              {lightboxImageLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="h-10 w-10 animate-spin text-white/60" />
                </div>
              )}

              {/* Layer 1: Low-quality preview — loads fast, shown immediately */}
              <Image
                key={`preview-${selectedImageIndex}`}
                src={images[selectedImageIndex].url}
                alt={
                  images[selectedImageIndex].caption ||
                  `${title} - Image ${selectedImageIndex + 1}`
                }
                width={828}
                height={466}
                className={cn(
                  "object-contain w-full h-full transition-opacity duration-200",
                  lightboxImageLoading ? "opacity-0" : "opacity-100",
                  // Hide preview once full-res is ready
                  fullResReady.has(selectedImageIndex) ? "invisible" : "visible"
                )}
                sizes="100vw"
                quality={50}
                priority
                onLoad={() => {
                  setLightboxImageLoading(false)
                  setLoadedLightboxImages((prev) => new Set(prev).add(selectedImageIndex!))
                }}
              />

              {/* Layer 2: Full-res original — loads in background, swaps in seamlessly */}
              {/* Uses unoptimized to serve the original file from utfs.io directly */}
              <img
                key={`fullres-${selectedImageIndex}`}
                src={images[selectedImageIndex].url}
                alt={
                  images[selectedImageIndex].caption ||
                  `${title} - Image ${selectedImageIndex + 1}`
                }
                className={cn(
                  "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                  fullResReady.has(selectedImageIndex) ? "opacity-100" : "opacity-0"
                )}
                loading="eager"
                onLoad={() => {
                  setFullResReady((prev) => new Set(prev).add(selectedImageIndex!))
                }}
              />

              {/* Hidden preloaded previews for adjacent images — fast low-quality */}
              {preloadIndices.map((idx) => (
                <Image
                  key={`preload-${idx}`}
                  src={images[idx].url}
                  alt=""
                  width={828}
                  height={466}
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                  sizes="100vw"
                  quality={50}
                  priority
                  onLoad={() => {
                    setLoadedLightboxImages((prev) => new Set(prev).add(idx))
                  }}
                />
              ))}

              {/* Hidden full-res preloads for next/prev only */}
              {preloadIndices.slice(0, 3).map((idx) => (
                <img
                  key={`fullres-preload-${idx}`}
                  src={images[idx].url}
                  alt=""
                  className="absolute w-0 h-0 opacity-0 pointer-events-none"
                  loading="eager"
                  onLoad={() => {
                    setFullResReady((prev) => new Set(prev).add(idx))
                  }}
                />
              ))}
            </div>
          </div>

          {/* Caption if available */}
          {images[selectedImageIndex].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 max-w-2xl text-center">
              <p className="text-white/80 text-sm">
                {images[selectedImageIndex].caption}
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
