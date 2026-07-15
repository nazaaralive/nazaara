"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { updateEvent, autosaveEvent } from "@/lib/admin-actions"
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

function SubmitButton({ willBePublished }: { willBePublished: boolean }) {
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
          {willBePublished ? "Publishing..." : "Saving..."}
        </>
      ) : (
        <>
          <Save className="h-4 w-4 mr-2" />
          {willBePublished ? "Publish Changes" : "Save Draft"}
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
  // Live mirror of the Published checkbox (drives the submit button label)
  const [publishChecked, setPublishChecked] = useState<boolean>(event.isPublished)

  // ── Autosave (drafts only) ────────────────────────────────────
  // Any input/change inside the form schedules a debounced autosave. Only
  // DRAFT events autosave — published events require the explicit
  // "Publish Changes" click so half-finished edits never go live.
  const formRef = useRef<HTMLFormElement>(null)
  const isDraft = !event.isPublished
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle")
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)

  const runAutosave = useCallback(async () => {
    if (!formRef.current || savingRef.current) return
    savingRef.current = true
    setSaveState("saving")
    try {
      const fd = new FormData(formRef.current)
      const result = await autosaveEvent(fd)
      if (result.ok) {
        setSaveState("saved")
        // Keep the URL in sync if the slug changed mid-edit
        if (result.slug && result.slug !== event.slug) {
          window.history.replaceState({}, "", `/admin/events/${result.slug}`)
        }
      } else if (result.reason === "incomplete") {
        setSaveState("dirty") // required field mid-edit; retry on next change
      } else {
        setSaveState("error")
      }
    } catch {
      setSaveState("error")
    } finally {
      savingRef.current = false
    }
  }, [event.slug])

  const scheduleAutosave = useCallback(() => {
    setSaveState(prev => (prev === "saving" ? prev : "dirty"))
    if (!isDraft) return // published events: track dirty only, no silent saves
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(runAutosave, 2000)
  }, [isDraft, runAutosave])

  useEffect(() => {
    const form = formRef.current
    if (!form) return
    const handler = () => scheduleAutosave()
    form.addEventListener("input", handler)
    form.addEventListener("change", handler)
    return () => {
      form.removeEventListener("input", handler)
      form.removeEventListener("change", handler)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [scheduleAutosave])

  // Warn before leaving with unsaved changes (published events have no
  // autosave, and drafts may have a save still pending).
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving") {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [saveState])

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
    <form
      ref={formRef}
      action={updateEvent}
      onSubmit={() => {
        // Explicit save/publish in flight — cancel pending autosave and clear
        // the dirty flag so the leave-warning doesn't fire on the redirect.
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaveState("idle")
      }}
    >
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
                onCheckedChange={(v) => setPublishChecked(v === true)}
              />
              <Label htmlFor="isPublished">Published (visible to public)</Label>
            </div>
            {isDraft && (
              <p className="text-xs text-muted-foreground mt-2">
                Draft mode: your edits autosave automatically. Publishing requires the button below.
              </p>
            )}
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
        <div className="flex gap-3 justify-end items-center">
          {/* Autosave / unsaved-changes status */}
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {saveState === "saving" && (<span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>)}
            {saveState === "saved" && <span className="text-green-500">✓ Draft saved</span>}
            {saveState === "dirty" && (isDraft ? "Unsaved changes…" : "Unpublished changes")}
            {saveState === "error" && <span className="text-red-400">Autosave failed — use the button</span>}
          </span>
          <Link href="/admin">
            <Button variant="outline">
              Cancel
            </Button>
          </Link>
          <SubmitButton willBePublished={publishChecked} />
        </div>
      </div>
    </form>
  )
}