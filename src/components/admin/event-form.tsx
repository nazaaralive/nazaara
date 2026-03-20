"use client"

import { useState, useEffect } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { EventDatePicker } from "@/components/admin/event-date-picker"
import { ImageUpload } from "@/components/admin/image-upload"
import { ArtistSelector } from "@/components/admin/artist-selector"
import { createEvent } from "@/lib/admin-actions"
import Link from "next/link"
import { Calendar, MapPin, Save, Ticket, Loader2 } from "lucide-react"
import { EventStopsEditor } from "@/components/admin/event-stops-editor"

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

interface EventFormProps {
  venues: Venue[]
  artists: Artist[]
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
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
          Creating...
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          Create Event
        </>
      )}
    </Button>
  )
}

export function EventForm({ venues, artists }: EventFormProps) {
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [isTour, setIsTour] = useState<boolean>(false)

  // Auto-generate slug from title only if not manually edited
  useEffect(() => {
    if (!isSlugManuallyEdited && title) {
      setSlug(generateSlug(title))
    }
  }, [title, isSlugManuallyEdited])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
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
    // Mark as manually edited if the user types something different from auto-generated
    if (newSlug !== generateSlug(title)) {
      setIsSlugManuallyEdited(true)
    }
  }

  const handleSlugFocus = () => {
    // When user focuses the slug field, assume they might want to edit it
    if (slug) {
      setIsSlugManuallyEdited(true)
    }
  }

  return (
    <form action={createEvent}>
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Form Fields (2/3 width) */}
        <div className="lg:col-span-2 space-y-8">

          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={handleTitleChange}
                  required
                  placeholder="NAZAARA"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  URL Slug *
                  {!isSlugManuallyEdited && title && (
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
                  placeholder="nazaara-01"
                  className={`bg-background border-border ${!isSlugManuallyEdited && title ? "text-muted-foreground" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: /events/{slug || "your-event-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  name="tagline"
                  placeholder="Live In Vancouver"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Experience the ultimate South Asian music event..."
                  className="bg-background border-border resize-none"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            <div className="space-y-4">
              {!isTour && <EventDatePicker />}

              {!isTour && (
                <div className="space-y-2">
                  <Label htmlFor="venueId">Venue *</Label>
                  <Select name="venueId" required>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id.toString()}>
                          {venue.name} - {venue.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <ArtistSelector artists={artists} />

              {!isTour && (
                <div className="space-y-2">
                  <Label htmlFor="ticketUrl">Ticket URL</Label>
                  <Input
                    id="ticketUrl"
                    name="ticketUrl"
                    placeholder="https://tickets.example.com/event"
                    className="bg-background border-border"
                  />
                </div>
              )}

              {isTour && (
                <div className="space-y-2">
                  <EventStopsEditor venues={venues} />
                </div>
              )}
            </div>
          </div>

          {/* Publishing */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Publishing</h2>
            <div className="flex items-center space-x-2 mb-3">
              {/* FIX: Use explicit hidden input for reliable form submission with server actions */}
              <input type="hidden" name="isTour" value={isTour ? "on" : ""} />
              <Checkbox
                id="isTour"
                checked={isTour}
                onCheckedChange={(v) => setIsTour(v === true)}
              />
              <Label htmlFor="isTour">This is a tour (multiple cities)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="hidden" name="isPublished" value="" />
              <Checkbox id="isPublished" name="isPublished" />
              <Label htmlFor="isPublished">Published (visible to public)</Label>
            </div>
          </div>
        </div>

        {/* Right Column - Media (1/3 width) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Media */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Media</h2>
            <div className="space-y-2">
              <Label>Event Poster</Label>
              <ImageUpload name="image" />
            </div>
          </div>

          {/* Event Info Preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Event Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Schedule</p>
                  <p className="text-sm text-muted-foreground">
                    Date & time will appear here
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Venue</p>
                  <p className="text-sm text-muted-foreground">
                    Select a venue
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Tickets</p>
                  <p className="text-sm text-muted-foreground">
                    Add ticket URL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions - Full Width */}
      <div className="flex justify-end gap-3 pt-8 mt-8 border-t border-border">
        <Link href="/admin">
          <Button variant="outline">
            Cancel
          </Button>
        </Link>
        <SubmitButton />
      </div>
    </form>
  )
}
