"use client"

import Link from "next/link"
import Image from "next/image"
import { Calendar, Camera, MapPin } from "lucide-react"
import type { PublicGallery } from "@/lib/public-actions"

interface GalleryGridProps {
  galleries: PublicGallery[]
}

export function GalleryGrid({ galleries }: GalleryGridProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const getThumbnail = (gallery: PublicGallery) => {
    return gallery.coverImage || gallery.firstImage || null
  }

  if (galleries.length === 0) {
    return (
      <div className="text-center py-32">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-[color:var(--gold)]/20 blur-xl rounded-full" />
          <Camera className="h-20 w-20 mx-auto text-[color:var(--gold)] relative z-10" />
        </div>
        <h3 className="text-2xl font-serif font-light text-foreground mb-3">No galleries yet</h3>
        <p className="text-lg text-muted-foreground font-light">Check back soon for event photos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
      {galleries.map((gallery) => {
        const thumbnail = getThumbnail(gallery)
        
        return (
          <Link
            key={gallery.id}
            href={`/galleries/${gallery.slug}`}
            className="group relative block overflow-hidden bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-[color:var(--gold)]/20 transition-all duration-700 ease-out hover:-translate-y-2"
          >
            {/* Image Container */}
            <div className="relative aspect-[5/4] overflow-hidden">
              {thumbnail ? (
                <div className="absolute inset-0">
                  <Image
                    src={thumbnail}
                    alt={gallery.title}
                    fill
                    className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:brightness-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[color:var(--muted)] to-[color:var(--muted)]/80">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[color:var(--gold)]/20 blur-lg rounded-full" />
                    <Camera className="h-16 w-16 text-[color:var(--gold)]/60 relative z-10" />
                  </div>
                </div>
              )}

              {/* Sophisticated overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

              {/* Premium frame effect */}
              <div className="absolute inset-0 border border-[color:var(--gold)]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* City tag */}
              {gallery.city && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-[color:var(--gold)]/20 px-2.5 py-1">
                  <MapPin className="h-3 w-3 text-[color:var(--gold)]/70" />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--gold)]">
                    {gallery.city}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <h3 className="text-xl lg:text-2xl font-serif font-light text-foreground group-hover:text-[color:var(--gold)] transition-colors duration-500 leading-tight">
                {gallery.title}
              </h3>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 text-[color:var(--gold)]/60" />
                <span className="font-light tracking-wide">{formatDate(gallery.date)}</span>
              </div>
              
              {/* Subtle accent line */}
              <div className="w-8 h-px bg-[color:var(--gold)]/40 group-hover:w-16 group-hover:bg-[color:var(--gold)] transition-all duration-700" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
