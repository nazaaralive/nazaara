"use client"

import { useState } from "react"
import Image from "next/image"
import { MapPin } from "lucide-react"

interface VenueImageProps {
  src?: string | null
  alt: string
}

// next/image → optimized thumbnail instead of full-size original (see artist-image.tsx).
export function VenueImage({ src, alt }: VenueImageProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <>
      {src && !imageError ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[--gold]/10">
          <MapPin className="h-5 w-5 text-[--gold]" />
        </div>
      )}
    </>
  )
}
