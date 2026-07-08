"use client"

import { useState } from "react"
import Image from "next/image"
import { Users } from "lucide-react"

interface ArtistImageProps {
  src?: string | null
  alt: string
}

// Uses next/image so the browser downloads an optimized ~200-400px WebP
// thumbnail instead of the full-size UploadThing original (often several MB).
// Optimized variants are cached at Vercel's edge after the first request,
// which is what makes the admin grids load fast on repeat visits.
export function ArtistImage({ src, alt }: ArtistImageProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <>
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-[--gold]/10">
          <Users className="h-8 w-8 text-[--gold]" />
        </div>
      )}
    </>
  )
}
