"use client"

import { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { EventDatePicker } from "@/components/admin/event-date-picker"
import { VenueSelector } from "@/components/admin/venue-selector"
import { ImageUpload } from "@/components/admin/image-upload"
import { ArtistSelector } from "@/components/admin/artist-selector"
import { updateEvent } from "@/lib/admin-actions"
import { DeleteEventForm } from "@/components/admin/delete-event-form"
import { Save, Calendar, Clock, Loader2 } from "lucide-react"
import Link from "next/link"
import { EventStopsEditor } from "@/components/admin/event-stops-editor"
import { formatInTimeZone } from "date-fns-tz"

interface Venue {
  id: number
  name: string
  city: string
}

interface Artist {
  id: number
  name: string
  slug: string
}

interface EventEditFormProps {
  event: {
    id: number
    title: string
    slug: string
    tagline: string | null
    description: string | null
    startTime: string | Date
    endTime: string | Date
    venueId: number | null
    venueName: string | null
    image: string | null
    imageKey: string | null
    ticketUrl: string | null
    isTour: boolean
    isPublished: boolean
    artists: { id: number; name: string; orderIndex?: number }[]
    stops?: {
      id: number
      city: string
      country: string
      venueId: number | null
      venueName: string | null
      startTime: string | Date
      endTime: string | Date
      ticketUrl: string | null
      orderIndex: number
    }[]
  }
  venues: Venue[]
  artists: Artist[]
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')   // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '')   // Remove leading/trailing hyphens
}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="bg-[--gold] text-[--maroon-red] hover:bg-[--gold]/90 font-semibold px-6 py-2.5 shadow-lg hover:shadow-xl border border-[--gold] hover:border-[--dark-gold] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </>
      )}
    </Button>
  )
}

export function EventEditForm({ event, venues, artists }: EventEditFormProps) {
  const [title, setTitle] = useState(event.title)
  const [slug, setSlug] = useState(event.slug)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(true) // Default to true for existing events
  const [isTour, setIsTour] = useState<boolean>(event.isTour)

  // Only auto-generate if slug is empty and not manually edited
  useEffect(() => {
    if (!isSlugManuallyEdited && title && !slug) {
      setSlug(generateSlug(title))
    }
  }, [title, isSlugManuallyEdited, slug])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    
    // If slug is empty and title changes, allow auto-generation
    if (!slug) {
      setIsSlugManuallyEdited(false)
    }
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newSlug = e.target.value
    
    // If it looks like a URL, extract just the path slug
    if (newSlug.includes('://') || newSlug.includes('http')) {
      try {
        const url = new URL(newSlug.startsWith('http') ? newSlug : `https://${newSlug}`)
        // Extract the last part of the path
        const pathParts = url.pathname.split('/').filter(Boolean)
        newSlug = pathParts[pathParts.length - 1] || ''
        // Remove query parameters if any
        newSlug = newSlug.split('?')[0]
      } catch {
        // If URL parsing fails, just sanitize it
        newSlug = generateSlug(newSlug)
      }
    }
    
    setSlug(newSlug)
    
    // Mark as manually edited when user types
    if (newSlug !== generateSlug(title)) {
      setIsSlugManuallyEdited(true)
    }
  }

  const handleSlugFocus = () => {
    // When user focuses the slug field with content, mark as manually edited
    if (slug) {
      setIsSlugManuallyEdited(true)
    }
  }

  return (
    <form action={updateEvent}>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Form Fields (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">
          <input type="hidden" name="eventId" value={event.id} />
          
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={title}
                    onChange={handleTitleChange}
                    required 
                    className="bg-background"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">
                    URL Slug *
                    {!isSlugManuallyEdited && !event.slug && title && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (auto-generated)
                      </span>
                    )}
                  </Label>
                  <Input 
                    id="slug" 
                    name="slug" 
                    value={slug}
                    onChange={handleSlugChange}
                    onFocus={handleSlugFocus}
                    required 
                    className={`bg-background ${!isSlugManuallyEdited && !event.slug && title ? "text-muted-foreground" : ""}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    nazaara.live/events/{slug || "your-event-slug"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input 
                  id="tagline" 
                  name="tagline" 
                  defaultValue={event.tagline || ""} 
                  placeholder="Live In Vancouver"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={event.description || ""} 
                  rows={4}
                  className="bg-background resize-none"
                />
              </div>
            </div>
          </div>

          {/* Date & Time */}
          {!isTour && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Date & Time</h2>
              <EventDatePicker 
                startTime={(() => {
                  const startDate = new Date(event.startTime)
                  console.log('🔍 [EVENT EDIT FORM] Creating start Date:', {
                    rawValue: event.startTime,
                    createdDate: startDate,
                    isValidDate: !isNaN(startDate.getTime()),
                    toISOString: startDate.toISOString(),
                  })
                  return startDate
                })()} 
                endTime={(() => {
                  const endDate = new Date(event.endTime)
                  console.log('🔍 [EVENT EDIT FORM] Creating end Date:', {
                    rawValue: event.endTime,
                    createdDate: endDate,
                    isValidDate: !isNaN(endDate.getTime()),
                    toISOString: endDate.toISOString(),
                  })
                  return endDate
                })()} 
              />
            </div>
          )}

          {/* Location */}
          {!isTour && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              <div className="space-y-2">
                <Label htmlFor="venueId">Venue *</Label>
                <VenueSelector venues={venues} defaultVenueId={event.venueId} />
              </div>
            </div>
          )}

          {/* Artists */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Artists</h2>
            <ArtistSelector 
              artists={artists} 
              selectedArtists={event.artists}
            />
          </div>

          {isTour && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Tour Stops</h2>
              <EventStopsEditor 
                venues={venues}
                initialStops={(event.stops || []).map((s) => ({
                  city: s.city,
                  country: s.country,
                  venueId: s.venueId,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  ticketUrl: s.ticketUrl,
                  orderIndex: s.orderIndex,
                }))}
              />
            </div>
          )}
        </div>

        {/* Right Column - Media and Publishing (1/3 width) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Media */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Media</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Poster</Label>
                <ImageUpload 
                  defaultImage={event.image} 
                  defaultImageKey={event.imageKey}
                  name="image" 
                />
              </div>

              {!isTour && (
                <div className="space-y-2">
                  <Label htmlFor="ticketUrl">Ticket URL</Label>
                  <Input 
                    id="ticketUrl" 
                    name="ticketUrl" 
                    defaultValue={event.ticketUrl || ""} 
                    placeholder="https://tickets.example.com/event"
                    className="bg-background"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Publishing */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Publishing</h2>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox 
                id="isTour" 
                name="isTour" 
                checked={isTour}
                onCheckedChange={(v) => setIsTour(v === true)}
              />
              <Label htmlFor="isTour">This is a tour (multiple cities)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="isPublished" 
                name="isPublished" 
                defaultChecked={event.isPublished}
              />
              <Label htmlFor="isPublished">Published (visible to public)</Label>
            </div>
          </div>

          {/* Event Schedule Info */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Event Schedule </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">Start Time</p>
                  <p className="text-foreground">
                    {formatInTimeZone(
                      new Date(event.startTime),
                      'UTC',
                      'EEEE, MMMM d, yyyy h:mm a'
                    )} 
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-xs">End Time</p>
                  <p className="text-foreground">
                    {formatInTimeZone(
                      new Date(event.endTime),
                      'UTC',
                      'EEEE, MMMM d, yyyy h:mm a'
                    )} 
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Full Width */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 pt-8 mt-8 border-t border-border">
        <DeleteEventForm eventId={event.id} />
        <div className="flex gap-3 justify-end">
          <Link href="/admin">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}