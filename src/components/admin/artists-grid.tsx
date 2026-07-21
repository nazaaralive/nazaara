"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, ExternalLink, Instagram, Music, GraduationCap } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toggleArtistAlumni } from "@/lib/admin-actions"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { ArtistImage } from "@/components/admin/artist-image"

interface Artist {
  id: number
  slug: string
  name: string
  instagram: string | null
  soundcloud: string | null
  image: string | null
  isAlumni: boolean
  eventCount: number
}

interface ArtistsGridProps {
  artists: Artist[]
}

const ARTISTS_PER_PAGE = 16 // 4x4 grid

export function ArtistsGrid({ artists }: ArtistsGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  // Local overrides for instant feedback; server revalidates in background
  const [alumniOverrides, setAlumniOverrides] = useState<Record<number, boolean>>({})
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const isAlumni = (artist: Artist) =>
    alumniOverrides[artist.id] ?? artist.isAlumni

  const handleToggleAlumni = async (artist: Artist) => {
    const next = !isAlumni(artist)
    setTogglingId(artist.id)
    setAlumniOverrides((prev) => ({ ...prev, [artist.id]: next }))
    try {
      await toggleArtistAlumni(artist.id, next)
    } catch {
      // Roll back on failure
      setAlumniOverrides((prev) => ({ ...prev, [artist.id]: !next }))
    } finally {
      setTogglingId(null)
    }
  }

  // Filter artists based on search query
  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return artists

    const query = searchQuery.toLowerCase()
    return artists.filter(
      (artist) =>
        artist.name.toLowerCase().includes(query) ||
        (artist.instagram && artist.instagram.toLowerCase().includes(query))
    )
  }, [artists, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredArtists.length / ARTISTS_PER_PAGE)
  const startIndex = (currentPage - 1) * ARTISTS_PER_PAGE
  const endIndex = startIndex + ARTISTS_PER_PAGE
  const paginatedArtists = filteredArtists.slice(startIndex, endIndex)

  // Reset to page 1 when search query changes
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const showEllipsisThreshold = 5
    
    if (totalPages <= showEllipsisThreshold) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i)
        pages.push("ellipsis")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("ellipsis")
        for (let i = totalPages - 2; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("ellipsis")
        pages.push(currentPage)
        pages.push("ellipsis")
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search artists by name or Instagram..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredArtists.length === 0 ? (
          "No artists found"
        ) : (
          <>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredArtists.length)} of{" "}
            {filteredArtists.length} artist{filteredArtists.length !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {paginatedArtists.map((artist) => (
          <Link
            key={artist.id}
            href={`/admin/artists/${artist.slug}`}
            className="group relative overflow-hidden rounded-lg border border-border bg-background hover:border-[--gold]/50 transition-all duration-300"
          >
            {/* Artist Image */}
            <div className="aspect-square relative overflow-hidden bg-muted">
              <ArtistImage src={artist.image} alt={artist.name} />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* View icon on hover */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink className="h-5 w-5 text-white" />
              </div>

              {/* Alumni badge */}
              {isAlumni(artist) && (
                <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-[--gold]/90 px-2 py-0.5">
                  <GraduationCap className="h-3 w-3 text-black" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-black">Alumni</span>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="p-4 space-y-2">
              <h3 className="font-medium text-foreground group-hover:text-[--gold] transition-colors line-clamp-1">
                {artist.name}
              </h3>
              
              {/* Social Links */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {artist.instagram && (
                  <div className="flex items-center gap-1">
                    <Instagram className="h-3 w-3" />
                    <span>@{artist.instagram}</span>
                  </div>
                )}
                {artist.soundcloud && (
                  <div className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    <span>SoundCloud</span>
                  </div>
                )}
              </div>

              {/* Event Count */}
              <div className="text-xs text-muted-foreground">
                {artist.eventCount} event{artist.eventCount !== 1 ? "s" : ""}
              </div>

              {/* Alumni toggle */}
              <button
                type="button"
                disabled={togglingId === artist.id}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleToggleAlumni(artist)
                }}
                className={
                  isAlumni(artist)
                    ? "w-full rounded border border-border px-2 py-1.5 text-xs text-muted-foreground hover:border-red-500/50 hover:text-red-500 transition-colors disabled:opacity-50"
                    : "w-full rounded border border-[--gold]/40 px-2 py-1.5 text-xs text-[--gold] hover:bg-[--gold]/10 transition-colors disabled:opacity-50"
                }
              >
                {togglingId === artist.id
                  ? "Saving…"
                  : isAlumni(artist)
                    ? "Hide from Alumni"
                    : "Add to Alumni"}
              </button>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      setCurrentPage(page as number)
                    }}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}