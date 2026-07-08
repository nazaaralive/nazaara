"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, Calendar, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatInTimeZone } from "date-fns-tz"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

interface Event {
  id: number
  slug: string
  title: string
  tagline: string | null
  startTime: Date
  endTime: Date
  image: string | null
  isPublished: boolean
  venueName: string | null
  artists: string[]
}

interface EventsGridProps {
  events: Event[]
}

const EVENTS_PER_PAGE = 12 // 4x3 grid

export function EventsGrid({ events }: EventsGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events

    const query = searchQuery.toLowerCase()
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        (event.tagline && event.tagline.toLowerCase().includes(query)) ||
        (event.venueName && event.venueName.toLowerCase().includes(query)) ||
        event.artists.some(artist => artist.toLowerCase().includes(query))
    )
  }, [events, searchQuery])

  // Calculate pagination
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE)
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE
  const endIndex = startIndex + EVENTS_PER_PAGE
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

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
          placeholder="Search events by title, venue, or artist..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredEvents.length === 0 ? (
          "No events found"
        ) : (
          <>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredEvents.length)} of{" "}
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </>
        )}
      </div>

      {/* Events Grid - Updated to 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {paginatedEvents.map((event) => {
          const startDate = new Date(event.startTime);
          const day = formatInTimeZone(startDate, 'UTC', 'd');
          const month = formatInTimeZone(startDate, 'UTC', 'MMM').toUpperCase();
          
          return (
            <Link key={event.id} href={`/admin/events/${event.slug}`}>
              <div className="group cursor-pointer relative">
                <div className="relative">
                  {/* Event Poster */}
                  <div className="relative aspect-[3/4] bg-muted overflow-hidden rounded-lg">
                    {event.image && event.image.startsWith('http') ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                        <Calendar className="h-12 w-12 mb-2" />
                        <span className="text-sm">No Image</span>
                      </div>
                    )}
                    
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Date Badge */}
                    <div className="absolute -top-2 -right-2 w-14 h-14 bg-[--gold] flex flex-col items-center justify-center rounded">
                      <p className="text-lg font-bold text-[--maroon-red]">
                        {day}
                      </p>
                      <p className="text-[8px] uppercase tracking-wider text-[--maroon-red]">
                        {month}
                      </p>
                    </div>
                    
                    {/* Status Badge */}
                    {!event.isPublished && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-yellow-500/90 text-black text-xs font-medium rounded">
                        DRAFT
                      </div>
                    )}
                  </div>
                  
                  {/* Event Info */}
                  <div className="pt-4">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-[--gold] transition-colors duration-300 line-clamp-1">
                      {event.title}
                    </h3>
                    {event.tagline && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {event.tagline}
                      </p>
                    )}
                    
                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-foreground line-clamp-1">
                        {event.venueName || "No venue"}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {event.artists.join(", ") || "No artists assigned"}
                      </p>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatInTimeZone(
                          new Date(event.startTime),
                          'UTC',
                          'EEE, MMM d, h:mm a'
                        )} 
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-[--gold]" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
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