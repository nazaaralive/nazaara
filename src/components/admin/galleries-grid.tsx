"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { Search, Image, ExternalLink, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface Gallery {
  id: number
  slug: string
  title: string
  description: string | null
  date: Date
  coverImage: string | null
  imageCount: number
  firstImage: string | null
}

interface GalleriesGridProps {
  galleries: Gallery[]
}

const GALLERIES_PER_PAGE = 12 // 4x3 grid

export function GalleriesGrid({ galleries }: GalleriesGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter galleries based on search query
  const filteredGalleries = useMemo(() => {
    if (!searchQuery.trim()) return galleries

    const query = searchQuery.toLowerCase()
    return galleries.filter(
      (gallery) =>
        gallery.title.toLowerCase().includes(query) ||
        (gallery.description && gallery.description.toLowerCase().includes(query))
    )
  }, [galleries, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredGalleries.length / GALLERIES_PER_PAGE)
  const startIndex = (currentPage - 1) * GALLERIES_PER_PAGE
  const paginatedGalleries = filteredGalleries.slice(startIndex, startIndex + GALLERIES_PER_PAGE)

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const getThumbnail = (gallery: Gallery) => {
    return gallery.coverImage || gallery.firstImage
  }

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search galleries..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Found {filteredGalleries.length} {filteredGalleries.length === 1 ? "gallery" : "galleries"}
        </p>
      )}

      {/* Galleries grid */}
      {paginatedGalleries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedGalleries.map((gallery) => {
            const thumbnail = getThumbnail(gallery)
            
            return (
              <Link
                key={gallery.id}
                href={`/admin/galleries/${gallery.slug}`}
                className="group relative overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                  {thumbnail ? (
                    <NextImage
                      src={thumbnail}
                      alt={gallery.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Gallery info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-[--gold]">
                      {gallery.title}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded shrink-0">
                      <Image className="h-3 w-3" />
                      {gallery.imageCount}
                    </span>
                  </div>

                  {gallery.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {gallery.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(gallery.date)}
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 border border-border rounded-lg bg-card">
          <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-1">
            {searchQuery ? "No galleries found" : "No galleries yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search"
              : "Create your first gallery to get started"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {currentPage > 1 && (
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}

            {Array.from({ length: totalPages }, (_, i) => {
              const page = i + 1
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              } else if (
                page === currentPage - 2 ||
                page === currentPage + 2
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return null
            })}

            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="cursor-pointer"
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}