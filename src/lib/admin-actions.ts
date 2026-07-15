"use server"

import { db } from "@/db/drizzle"
import { events, artists, venues, eventsArtists, galleries, galleryImages, djs, eventStops } from "@/db/schema"
import { eq, count, sql, desc, lt, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateSlug } from "@/lib/utils/slug"
import { getUTApi } from "@/lib/uploadthing-server"

export async function getAdminStats() {
  const [eventCount, artistCount, venueCount] = await Promise.all([
    db.select({ count: count() }).from(events),
    db.select({ count: count() }).from(artists),
    db.select({ count: count() }).from(venues),
  ])

  return {
    totalEvents: eventCount[0]?.count || 0,
    totalArtists: artistCount[0]?.count || 0,
    totalVenues: venueCount[0]?.count || 0,
  }
}

// Events whose start date is older than this are automatically hard-deleted
// (event row + poster image on UploadThing; artist links and tour stops
// cascade via FK) the next time the admin dashboard loads.
const AUTO_DELETE_EVENTS_AFTER_DAYS = 100

async function cleanupExpiredEvents() {
  const cutoff = new Date(Date.now() - AUTO_DELETE_EVENTS_AFTER_DAYS * 24 * 60 * 60 * 1000)
  const stale = await db
    .select({ id: events.id, slug: events.slug, imageKey: events.imageKey })
    .from(events)
    .where(lt(events.startTime, cutoff))

  if (stale.length === 0) return

  // Best-effort poster cleanup on UploadThing; never block the deletion.
  const imageKeys = stale.map(e => e.imageKey).filter((k): k is string => !!k)
  if (imageKeys.length > 0) {
    try {
      const utapi = getUTApi()
      await utapi.deleteFiles(imageKeys)
    } catch (error) {
      console.error("cleanupExpiredEvents: failed to delete images from UploadThing:", error)
    }
  }

  await db.delete(events).where(inArray(events.id, stale.map(e => e.id)))
  console.log(`cleanupExpiredEvents: deleted ${stale.length} event(s) older than ${AUTO_DELETE_EVENTS_AFTER_DAYS} days:`, stale.map(e => e.slug).join(", "))
}

export async function getAdminEvents() {
  // Auto-prune events older than 100 days before listing. Failure here must
  // never break the dashboard.
  try {
    await cleanupExpiredEvents()
  } catch (error) {
    console.error("cleanupExpiredEvents failed (non-fatal):", error)
  }

  const eventsWithDetails = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      tagline: events.tagline,
      startTime: events.startTime,
      endTime: events.endTime,
      image: events.image,
      isPublished: events.isPublished,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .orderBy(desc(events.startTime)) // latest events first

  // Get artists for each event in a single query
  const eventArtists = await db
    .select({
      eventId: eventsArtists.eventId,
      artistName: artists.name,
      orderIndex: eventsArtists.orderIndex,
    })
    .from(eventsArtists)
    .leftJoin(artists, eq(eventsArtists.artistId, artists.id))
    .orderBy(eventsArtists.eventId, eventsArtists.orderIndex)

  // Group artists by event
  const artistsByEvent = eventArtists.reduce((acc, row) => {
    if (!acc[row.eventId]) acc[row.eventId] = []
    if (row.artistName) acc[row.eventId].push(row.artistName)
    return acc
  }, {} as Record<number, string[]>)

  return eventsWithDetails.map(event => ({
    ...event,
    artists: artistsByEvent[event.id] || [],
  }))
}

export async function getAdminArtists() {
  const artistsWithEventCount = await db
    .select({
      id: artists.id,
      slug: artists.slug,
      name: artists.name,
      instagram: artists.instagram,
      soundcloud: artists.soundcloud,
      image: artists.image,
      eventCount: sql<number>`COALESCE(COUNT(${eventsArtists.eventId}), 0)`.as('eventCount'),
    })
    .from(artists)
    .leftJoin(eventsArtists, eq(artists.id, eventsArtists.artistId))
    .groupBy(artists.id, artists.slug, artists.name, artists.instagram, artists.soundcloud, artists.image)
    .orderBy(artists.name)

  return artistsWithEventCount
}

export async function getAdminVenues() {
  const venuesWithEventCount = await db
    .select({
      id: venues.id,
      slug: venues.slug,
      name: venues.name,
      description: venues.description,
      address: venues.address,
      city: venues.city,
      country: venues.country,
      images: venues.images,
      eventCount: sql<number>`COALESCE(COUNT(${events.id}), 0)`.as('eventCount'),
    })
    .from(venues)
    .leftJoin(events, eq(venues.id, events.venueId))
    .groupBy(venues.id, venues.slug, venues.name, venues.description, venues.address, venues.city, venues.country, venues.images)
    .orderBy(venues.name)

  return venuesWithEventCount
}

export async function getEventBySlug(slug: string) {
  const eventWithDetails = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      tagline: events.tagline,
      description: events.description,
      startTime: events.startTime,
      endTime: events.endTime,
      image: events.image,
      imageKey: events.imageKey,
      ticketUrl: events.ticketUrl,
      isTour: events.isTour,
      isPublished: events.isPublished,
      venueId: events.venueId,
      venueName: venues.name,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.slug, slug))
    .limit(1)

  if (!eventWithDetails[0]) {
    return null
  }

  const eventArtists = await db
    .select({
      artistId: artists.id,
      artistName: artists.name,
      orderIndex: eventsArtists.orderIndex,
    })
    .from(eventsArtists)
    .leftJoin(artists, eq(eventsArtists.artistId, artists.id))
    .where(eq(eventsArtists.eventId, eventWithDetails[0].id))
    .orderBy(eventsArtists.orderIndex)

  // Get event stops if this event is a tour
  const stops = await db
    .select({
      id: eventStops.id,
      city: eventStops.city,
      country: eventStops.country,
      venueId: eventStops.venueId,
      venueName: venues.name,
      startTime: eventStops.startTime,
      endTime: eventStops.endTime,
      ticketUrl: eventStops.ticketUrl,
      orderIndex: eventStops.orderIndex,
    })
    .from(eventStops)
    .leftJoin(venues, eq(eventStops.venueId, venues.id))
    .where(eq(eventStops.eventId, eventWithDetails[0].id))
    .orderBy(eventStops.orderIndex, eventStops.startTime)

  return {
    ...eventWithDetails[0],
    artists: eventArtists.map(a => ({
      id: a.artistId,
      name: a.artistName,
      orderIndex: a.orderIndex,
    })),
    stops,
  }
}

// Live slug availability check for the event forms. Returns whether the
// normalized slug is free and, if taken, the first free "-2"/"-3"/… variant.
export async function checkEventSlug(rawSlug: string): Promise<{
  normalized: string
  available: boolean
  suggestion: string | null
}> {
  const normalized = generateSlug(rawSlug || "")
  if (!normalized) return { normalized: "", available: false, suggestion: null }

  // One query fetches the slug itself and every suffixed variant, so we can
  // both answer availability and compute a free suggestion.
  const rows = await db
    .select({ slug: events.slug })
    .from(events)
    .where(sql`${events.slug} = ${normalized} OR ${events.slug} LIKE ${normalized + "-%"}`)

  const taken = new Set(rows.map(r => r.slug))
  if (!taken.has(normalized)) {
    return { normalized, available: true, suggestion: null }
  }
  for (let i = 2; i < 100; i++) {
    const candidate = `${normalized}-${i}`
    if (!taken.has(candidate)) {
      return { normalized, available: false, suggestion: candidate }
    }
  }
  return { normalized, available: false, suggestion: null }
}

export async function deleteEvent(formData: FormData) {
  const eventId = parseInt(formData.get("eventId") as string)

  if (!eventId) {
    throw new Error("Event ID is required")
  }

  // First, get the event to retrieve the imageKey if it exists
  const event = await db
    .select({ imageKey: events.imageKey })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  // If the event has an imageKey, delete the image from UploadThing
  if (event[0]?.imageKey) {
    try {
      const utapi = getUTApi()
      await utapi.deleteFiles(event[0].imageKey)
      console.log(`Deleted image ${event[0].imageKey} from UploadThing`)
    } catch (error) {
      // Log error but don't fail the event deletion
      console.error("Failed to delete image from UploadThing:", error)
    }
  }

  // Delete the event from the database
  await db.delete(events).where(eq(events.id, eventId))

  revalidatePath("/admin")
  redirect("/admin")
}

// Shared persistence core for updateEvent (explicit save/publish) and
// autosaveEvent (silent draft autosave). When opts.keepPublishState is true
// the form's Published checkbox is IGNORED and the event's current publish
// state is preserved — autosave must never publish or unpublish anything.
async function persistEventFromForm(
  formData: FormData,
  opts: { keepPublishState?: boolean } = {}
): Promise<{ eventId: number; slug: string }> {
  const eventId = parseInt(formData.get("eventId") as string)
  const slug = formData.get("slug") as string
  const title = formData.get("title") as string
  const tagline = formData.get("tagline") as string
  const description = formData.get("description") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string

  console.log('🔍 [UPDATE EVENT] Received from form:', {
    eventId, title, startTime, endTime,
  })

  const image = formData.get("image") as string
  const imageKey = formData.get("imageKey") as string
  const ticketUrl = formData.get("ticketUrl") as string
  const isTour = formData.get("isTour") === "on"
  const isPublished = formData.get("isPublished") === "on"
  const venueIdStr = formData.get("venueId") as string
  const venueId = venueIdStr ? parseInt(venueIdStr) : null

  // Parse stops data from form (for tours) before validation so we can derive times
  const stopsData: {
    city: string; country: string; venueId: number | null;
    startTime: Date; endTime: Date; ticketUrl: string | null; orderIndex: number;
  }[] = []

  let stopIndex = 0
  while (formData.has(`stops[${stopIndex}][city]`)) {
    const city = (formData.get(`stops[${stopIndex}][city]`) as string) || ""
    const country = (formData.get(`stops[${stopIndex}][country]`) as string) || ""
    const stopVenueIdStr = formData.get(`stops[${stopIndex}][venueId]`) as string
    const stopVenueId = stopVenueIdStr ? parseInt(stopVenueIdStr) : null
    const stopStartTimeStr = formData.get(`stops[${stopIndex}][startTime]`) as string
    const stopEndTimeStr = formData.get(`stops[${stopIndex}][endTime]`) as string
    const stopTicketUrl = (formData.get(`stops[${stopIndex}][ticketUrl]`) as string) || null
    const stopOrderIndexStr = formData.get(`stops[${stopIndex}][orderIndex]`) as string
    const stopOrderIndex = stopOrderIndexStr ? parseInt(stopOrderIndexStr) : stopIndex

    if (city && country && stopStartTimeStr && stopEndTimeStr) {
      stopsData.push({
        city, country, venueId: stopVenueId,
        startTime: new Date(stopStartTimeStr), endTime: new Date(stopEndTimeStr),
        ticketUrl: stopTicketUrl, orderIndex: stopOrderIndex,
      })
    }
    stopIndex++
  }

  // Validate required fields: allow tours without top-level start/end if stops provided
  if (!eventId || !slug || !title) {
    throw new Error("Required fields missing")
  }

  const hasTopLevelTimes = Boolean(startTime && endTime)
  if (!hasTopLevelTimes && !(isTour && stopsData.length > 0)) {
    console.error('[updateEvent] Validation failed:', {
      slug, title, startTime, endTime,
      isTour, stopsDataLength: stopsData.length,
      hasTopLevelTimes,
      rawIsTour: formData.get("isTour"),
    })
    throw new Error("Required fields missing")
  }

  // Parse artist data from form
  const artistData: { id: number; orderIndex: number }[] = []
  let index = 0
  while (formData.has(`artists[${index}][id]`)) {
    const artistId = parseInt(formData.get(`artists[${index}][id]`) as string)
    const orderIndex = parseInt(formData.get(`artists[${index}][orderIndex]`) as string)
    artistData.push({ id: artistId, orderIndex })
    index++
  }

  // Get the current event to check if image is being replaced (and to
  // preserve the publish state during autosave)
  const currentEvent = await db
    .select({ imageKey: events.imageKey, image: events.image, isPublished: events.isPublished })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1)

  // If there's an old imageKey and it's different from the new one, delete the old image
  if (currentEvent[0]?.imageKey && currentEvent[0].imageKey !== imageKey) {
    try {
      const utapi = getUTApi()
      await utapi.deleteFiles(currentEvent[0].imageKey)
      console.log(`Deleted old image ${currentEvent[0].imageKey} from UploadThing`)
    } catch (error) {
      console.error("Failed to delete old image from UploadThing:", error)
    }
  }

  // Update the event
  // Derive event-level times if missing and tour stops exist
  const eventStartTime = startTime
    ? new Date(startTime)
    : (isTour && stopsData.length > 0
      ? new Date(Math.min(...stopsData.map(s => s.startTime.getTime())))
      : undefined)

  const eventEndTime = endTime
    ? new Date(endTime)
    : (isTour && stopsData.length > 0
      ? new Date(Math.max(...stopsData.map(s => s.endTime.getTime())))
      : undefined)

  console.log('🔍 [UPDATE EVENT] Created Date objects:', {
    startTimeString: startTime, endTimeString: endTime,
    eventStartTime, eventEndTime,
    eventStartTimeISO: eventStartTime?.toISOString(),
    eventEndTimeISO: eventEndTime?.toISOString(),
  })

  console.log('🔍 [UPDATE EVENT] Saving to database:', {
    eventId, startTime: eventStartTime, endTime: eventEndTime,
    startTimeISO: eventStartTime?.toISOString(),
    endTimeISO: eventEndTime?.toISOString(),
  })

  await db
    .update(events)
    .set({
      slug,
      title,
      tagline: tagline || null,
      description: description || null,
      startTime: eventStartTime as Date,
      endTime: eventEndTime as Date,
      image: image || null,
      imageKey: imageKey || null,
      ticketUrl: ticketUrl || null,
      isTour,
      isPublished: opts.keepPublishState ? (currentEvent[0]?.isPublished ?? false) : isPublished,
      venueId,
    })
    .where(eq(events.id, eventId))

  console.log('🔍 [UPDATE EVENT] Successfully saved to database')

  // Delete existing artist relationships
  await db
    .delete(eventsArtists)
    .where(eq(eventsArtists.eventId, eventId))

  // Insert new artist relationships if any artists were selected
  if (artistData.length > 0) {
    await db
      .insert(eventsArtists)
      .values(
        artistData.map(artist => ({
          eventId: eventId,
          artistId: artist.id,
          orderIndex: artist.orderIndex,
        }))
      )
  }

  // Replace event stops
  await db
    .delete(eventStops)
    .where(eq(eventStops.eventId, eventId))

  if (isTour && stopsData.length > 0) {
    await db
      .insert(eventStops)
      .values(
        stopsData.map((stop) => ({
          eventId: eventId,
          city: stop.city,
          country: stop.country,
          venueId: stop.venueId,
          startTime: stop.startTime,
          endTime: stop.endTime,
          ticketUrl: stop.ticketUrl,
          orderIndex: stop.orderIndex,
        }))
      )
  }

  return { eventId, slug }
}

export async function updateEvent(formData: FormData) {
  const { slug } = await persistEventFromForm(formData)

  // Revalidate admin pages
  revalidatePath("/admin")
  revalidatePath(`/admin/events/${slug}`)
  // Revalidate public pages to show updated event data
  revalidatePath("/", "page")             // Home page
  revalidatePath(`/event/${slug}`, "page") // Event detail page

  // Stay on the event's edit page after saving (don't bounce to the dashboard)
  redirect(`/admin/events/${slug}?success=event-updated`)
}

// Silent autosave for DRAFT events, called imperatively from the edit form
// (no redirect, returns a result object). Refuses to touch published events —
// their edits go live only via the explicit "Publish changes" button.
export async function autosaveEvent(formData: FormData): Promise<{
  ok: boolean
  reason?: string
  slug?: string
}> {
  try {
    const eventId = parseInt(formData.get("eventId") as string)
    if (!eventId) return { ok: false, reason: "invalid" }

    const current = await db
      .select({ isPublished: events.isPublished })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)
    if (!current[0]) return { ok: false, reason: "not-found" }
    if (current[0].isPublished) return { ok: false, reason: "published" }

    // Incomplete mid-edit states (e.g. cleared title) simply skip this cycle.
    const slug = formData.get("slug") as string
    const title = formData.get("title") as string
    if (!slug || !title) return { ok: false, reason: "incomplete" }

    const result = await persistEventFromForm(formData, { keepPublishState: true })
    revalidatePath("/admin")
    revalidatePath(`/admin/events/${result.slug}`)
    return { ok: true, slug: result.slug }
  } catch (error) {
    console.error("autosaveEvent failed:", error)
    return { ok: false, reason: "error" }
  }
}


export async function createEvent(formData: FormData) {
  const slug = formData.get("slug") as string
  const title = formData.get("title") as string
  const tagline = formData.get("tagline") as string
  const description = formData.get("description") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const image = formData.get("image") as string
  const imageKey = formData.get("imageKey") as string
  const ticketUrl = formData.get("ticketUrl") as string
  const isTour = formData.get("isTour") === "on"
  const isPublished = formData.get("isPublished") === "on"
  const venueIdStr = formData.get("venueId") as string
  const venueId = venueIdStr ? parseInt(venueIdStr) : null

  // Parse stops before validation so we can derive times for tours
  const stopsData: {
    city: string; country: string; venueId: number | null;
    startTime: Date; endTime: Date; ticketUrl: string | null; orderIndex: number;
  }[] = []

  let stopIndex = 0
  while (formData.has(`stops[${stopIndex}][city]`)) {
    const city = (formData.get(`stops[${stopIndex}][city]`) as string) || ""
    const country = (formData.get(`stops[${stopIndex}][country]`) as string) || ""
    const stopVenueIdStr = formData.get(`stops[${stopIndex}][venueId]`) as string
    const stopVenueId = stopVenueIdStr ? parseInt(stopVenueIdStr) : null
    const stopStartTimeStr = formData.get(`stops[${stopIndex}][startTime]`) as string
    const stopEndTimeStr = formData.get(`stops[${stopIndex}][endTime]`) as string
    const stopTicketUrl = (formData.get(`stops[${stopIndex}][ticketUrl]`) as string) || null
    const stopOrderIndexStr = formData.get(`stops[${stopIndex}][orderIndex]`) as string
    const stopOrderIndex = stopOrderIndexStr ? parseInt(stopOrderIndexStr) : stopIndex

    if (city && country && stopStartTimeStr && stopEndTimeStr) {
      stopsData.push({
        city, country, venueId: stopVenueId,
        startTime: new Date(stopStartTimeStr), endTime: new Date(stopEndTimeStr),
        ticketUrl: stopTicketUrl, orderIndex: stopOrderIndex,
      })
    }
    stopIndex++
  }

  if (!slug || !title) {
    console.error('[createEvent] Missing slug or title:', { slug, title })
    throw new Error("Required fields missing")
  }

  const hasTopLevelTimes = Boolean(startTime && endTime)
  if (!hasTopLevelTimes && !(isTour && stopsData.length > 0)) {
    console.error('[createEvent] Validation failed:', {
      slug, title, startTime, endTime,
      isTour, stopsDataLength: stopsData.length,
      hasTopLevelTimes,
      rawIsTour: formData.get("isTour"),
    })
    throw new Error("Required fields missing")
  }

  // Parse artist data from form
  const artistData: { id: number; orderIndex: number }[] = []
  let index = 0
  while (formData.has(`artists[${index}][id]`)) {
    const artistId = parseInt(formData.get(`artists[${index}][id]`) as string)
    const orderIndex = parseInt(formData.get(`artists[${index}][orderIndex]`) as string)
    artistData.push({ id: artistId, orderIndex })
    index++
  }

  // Derive event-level times if missing and tour stops exist
  const eventStartTime = startTime
    ? new Date(startTime)
    : (isTour && stopsData.length > 0
      ? new Date(Math.min(...stopsData.map(s => s.startTime.getTime())))
      : undefined)

  const eventEndTime = endTime
    ? new Date(endTime)
    : (isTour && stopsData.length > 0
      ? new Date(Math.max(...stopsData.map(s => s.endTime.getTime())))
      : undefined)

  // Insert event and get the ID
  const [newEvent] = await db
    .insert(events)
    .values({
      slug,
      title,
      tagline: tagline || null,
      description: description || null,
      startTime: eventStartTime as Date,
      endTime: eventEndTime as Date,
      image: image || null,
      imageKey: imageKey || null,
      ticketUrl: ticketUrl || null,
      isTour,
      isPublished,
      venueId,
    })
    .returning({ id: events.id })

  // Insert artist relationships if any artists were selected
  if (artistData.length > 0 && newEvent) {
    await db
      .insert(eventsArtists)
      .values(
        artistData.map(artist => ({
          eventId: newEvent.id,
          artistId: artist.id,
          orderIndex: artist.orderIndex,
        }))
      )
  }

  // Insert stops if provided and marked as tour
  if (isTour && stopsData.length > 0 && newEvent) {
    await db
      .insert(eventStops)
      .values(
        stopsData.map((stop) => ({
          eventId: newEvent.id,
          city: stop.city,
          country: stop.country,
          venueId: stop.venueId,
          startTime: stop.startTime,
          endTime: stop.endTime,
          ticketUrl: stop.ticketUrl,
          orderIndex: stop.orderIndex,
        }))
      )
  }

  revalidatePath("/admin")
  revalidatePath("/", "page")
  // Land on the new event's edit page so publish status and details are
  // immediately visible/adjustable (instead of bouncing to the dashboard).
  redirect(`/admin/events/${slug}?success=event-created`)
}

// Venue CRUD operations
export async function getVenueBySlug(slug: string) {
  const venue = await db
    .select()
    .from(venues)
    .where(eq(venues.slug, slug))
    .limit(1)

  if (!venue[0]) {
    return null
  }

  // Get event count for this venue
  const eventCount = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.venueId, venue[0].id))

  return {
    ...venue[0],
    eventCount: eventCount[0]?.count || 0,
  }
}

export async function createVenue(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const addressUrl = formData.get("addressUrl") as string
  const city = formData.get("city") as string
  const country = formData.get("country") as string

  // Handle multiple images
  const image1 = formData.get("image1") as string
  const image2 = formData.get("image2") as string
  const image3 = formData.get("image3") as string
  const images = [image1, image2, image3].filter(Boolean)

  if (!name || !city || !country) {
    throw new Error("Required fields missing")
  }

  const slug = generateSlug(name)

  const result = await db
    .insert(venues)
    .values({
      slug,
      name,
      description: description || null,
      address: address || null,
      addressUrl: addressUrl || null,
      city,
      country,
      images: images.length > 0 ? images : null,
    })
    .returning({ slug: venues.slug })

  revalidatePath("/admin")
  redirect(`/admin/venues/${result[0].slug}?success=venue-created`)
}

export async function updateVenue(formData: FormData) {
  const venueId = parseInt(formData.get("venueId") as string)
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const address = formData.get("address") as string
  const addressUrl = formData.get("addressUrl") as string
  const city = formData.get("city") as string
  const country = formData.get("country") as string

  // Handle multiple images and their keys
  const image1 = formData.get("image1") as string
  const image2 = formData.get("image2") as string
  const image3 = formData.get("image3") as string
  const image1Key = formData.get("image1Key") as string
  const image2Key = formData.get("image2Key") as string
  const image3Key = formData.get("image3Key") as string
  const images = [image1, image2, image3].filter(Boolean)
  const imageKeys = [image1Key, image2Key, image3Key].filter(Boolean)

  if (!venueId || !name || !city || !country) {
    throw new Error("Required fields missing")
  }

  const slug = generateSlug(name)

  await db
    .update(venues)
    .set({
      slug,
      name,
      description: description || null,
      address: address || null,
      addressUrl: addressUrl || null,
      city,
      country,
      images: images.length > 0 ? images : null,
      imageKeys: imageKeys.length > 0 ? imageKeys : null,
      updatedAt: new Date(),
    })
    .where(eq(venues.id, venueId))

  revalidatePath("/admin")
  revalidatePath(`/admin/venues/${slug}`)
  redirect(`/admin/venues/${slug}?success=venue-updated`)
}

export async function deleteVenue(formData: FormData) {
  const venueId = parseInt(formData.get("venueId") as string)

  if (!venueId) {
    throw new Error("Venue ID is required")
  }

  // Delete venue - associated events will have their venueId set to null
  await db.delete(venues).where(eq(venues.id, venueId))

  revalidatePath("/admin")
  redirect("/admin")
}

// Artist CRUD operations
export async function getArtistBySlug(slug: string) {
  const artist = await db
    .select()
    .from(artists)
    .where(eq(artists.slug, slug))
    .limit(1)

  if (!artist[0]) {
    return null
  }

  // Get events for this artist
  const artistEvents = await db
    .select({
      eventId: events.id,
      eventTitle: events.title,
      eventSlug: events.slug,
      startTime: events.startTime,
    })
    .from(eventsArtists)
    .leftJoin(events, eq(eventsArtists.eventId, events.id))
    .where(eq(eventsArtists.artistId, artist[0].id))
    .orderBy(events.startTime)

  return {
    ...artist[0],
    events: artistEvents,
  }
}

export async function createArtist(formData: FormData) {
  const name = formData.get("name") as string
  const instagram = formData.get("instagram") as string
  const soundcloud = formData.get("soundcloud") as string
  const image = formData.get("image") as string

  if (!name) {
    throw new Error("Artist name is required")
  }

  const slug = generateSlug(name)

  const result = await db
    .insert(artists)
    .values({
      slug,
      name,
      instagram: instagram || null,
      soundcloud: soundcloud || null,
      image: image || null,
    })
    .returning({ slug: artists.slug })

  revalidatePath("/admin")
  redirect(`/admin/artists/${result[0].slug}?success=artist-created`)
}

export async function updateArtist(formData: FormData) {
  const artistId = parseInt(formData.get("artistId") as string)
  const name = formData.get("name") as string
  const instagram = formData.get("instagram") as string
  const soundcloud = formData.get("soundcloud") as string
  const image = formData.get("image") as string

  if (!artistId || !name) {
    throw new Error("Required fields missing")
  }

  const slug = generateSlug(name)

  await db
    .update(artists)
    .set({
      slug,
      name,
      instagram: instagram || null,
      soundcloud: soundcloud || null,
      image: image || null,
      updatedAt: new Date(),
    })
    .where(eq(artists.id, artistId))

  revalidatePath("/admin")
  revalidatePath(`/admin/artists/${slug}`)
  redirect(`/admin/artists/${slug}?success=artist-updated`)
}

export async function deleteArtist(formData: FormData) {
  const artistId = parseInt(formData.get("artistId") as string)

  if (!artistId) {
    throw new Error("Artist ID is required")
  }

  // Deleting artist will cascade delete from eventsArtists junction table
  await db.delete(artists).where(eq(artists.id, artistId))

  revalidatePath("/admin")
  redirect("/admin")
}

// Gallery CRUD operations
export async function getAdminGalleries() {
  const galleriesWithImageCount = await db
    .select({
      id: galleries.id,
      slug: galleries.slug,
      title: galleries.title,
      description: galleries.description,
      date: galleries.date,
      coverImage: galleries.coverImage,
      imageCount: sql<number>`COALESCE(COUNT(${galleryImages.id}), 0)`.as('imageCount'),
      firstImage: sql<string | null>`MIN(${galleryImages.url})`.as('firstImage'),
    })
    .from(galleries)
    .leftJoin(galleryImages, eq(galleries.id, galleryImages.galleryId))
    .groupBy(galleries.id, galleries.slug, galleries.title, galleries.description, galleries.date, galleries.coverImage)
    .orderBy(desc(galleries.date))

  return galleriesWithImageCount
}

export async function getGalleryBySlug(slug: string) {
  const gallery = await db
    .select()
    .from(galleries)
    .where(eq(galleries.slug, slug))
    .limit(1)

  if (!gallery[0]) {
    return null
  }

  // Get all images for this gallery, ordered by orderIndex
  const images = await db
    .select({
      id: galleryImages.id,
      url: galleryImages.url,
      key: galleryImages.key,
      caption: galleryImages.caption,
      orderIndex: galleryImages.orderIndex,
    })
    .from(galleryImages)
    .where(eq(galleryImages.galleryId, gallery[0].id))
    .orderBy(galleryImages.orderIndex)

  return {
    ...gallery[0],
    images,
  }
}

export async function createGallery(formData: FormData) {
  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const dateStr = formData.get("date") as string

  if (!title || !dateStr) {
    throw new Error("Required fields missing")
  }

  const slug = generateSlug(title)
  const date = new Date(dateStr)

  // Parse image data from form
  const imageData: { url: string; key: string; orderIndex: number }[] = []
  let index = 0
  while (formData.has(`images[${index}][url]`)) {
    const url = formData.get(`images[${index}][url]`) as string
    const key = formData.get(`images[${index}][key]`) as string
    if (url && key) {
      imageData.push({ url, key, orderIndex: index })
    }
    index++
  }

  // Create the gallery
  const [newGallery] = await db
    .insert(galleries)
    .values({
      slug,
      title,
      description: description || null,
      date,
      coverImage: imageData[0]?.url || null, // Use first image as cover by default
    })
    .returning({ id: galleries.id })

  // Insert gallery images if any
  if (imageData.length > 0 && newGallery) {
    await db
      .insert(galleryImages)
      .values(
        imageData.map(image => ({
          galleryId: newGallery.id,
          url: image.url,
          key: image.key,
          orderIndex: image.orderIndex,
        }))
      )
  }

  revalidatePath("/admin")
  redirect(`/admin/galleries/${slug}?success=gallery-created`)
}

export async function updateGallery(formData: FormData) {
  const galleryId = parseInt(formData.get("galleryId") as string)
  const title = formData.get("title") as string
  const slug = formData.get("slug") as string
  const description = formData.get("description") as string
  const dateStr = formData.get("date") as string

  if (!galleryId || !title || !slug || !dateStr) {
    throw new Error("Required fields missing")
  }

  const date = new Date(dateStr)

  // Parse new image data from form
  const imageData: { url: string; key: string; orderIndex: number }[] = []
  let index = 0
  while (formData.has(`images[${index}][url]`)) {
    const url = formData.get(`images[${index}][url]`) as string
    const key = formData.get(`images[${index}][key]`) as string
    if (url && key) {
      imageData.push({ url, key, orderIndex: index })
    }
    index++
  }

  // Get existing images to clean up any removed ones
  const existingImages = await db
    .select({ key: galleryImages.key })
    .from(galleryImages)
    .where(eq(galleryImages.galleryId, galleryId))

  const existingKeys = new Set(existingImages.map(img => img.key))
  const newKeys = new Set(imageData.map(img => img.key))

  // Find keys to delete from UploadThing
  const keysToDelete = Array.from(existingKeys).filter(key => !newKeys.has(key))
  if (keysToDelete.length > 0) {
    const utapi = getUTApi()
    await utapi.deleteFiles(keysToDelete)
  }

  // Update gallery
  await db
    .update(galleries)
    .set({
      slug,
      title,
      description: description || null,
      date,
      coverImage: imageData[0]?.url || null,
      updatedAt: new Date(),
    })
    .where(eq(galleries.id, galleryId))

  // Delete existing image records
  await db
    .delete(galleryImages)
    .where(eq(galleryImages.galleryId, galleryId))

  // Insert new image records
  if (imageData.length > 0) {
    await db
      .insert(galleryImages)
      .values(
        imageData.map(image => ({
          galleryId,
          url: image.url,
          key: image.key,
          orderIndex: image.orderIndex,
        }))
      )
  }

  revalidatePath("/admin")
  revalidatePath(`/admin/galleries/${slug}`)
  redirect(`/admin/galleries/${slug}?success=gallery-updated`)
}

export async function deleteGallery(formData: FormData) {
  const galleryId = parseInt(formData.get("galleryId") as string)

  if (!galleryId) {
    throw new Error("Gallery ID is required")
  }

  // Get all image keys for cleanup
  const images = await db
    .select({ key: galleryImages.key })
    .from(galleryImages)
    .where(eq(galleryImages.galleryId, galleryId))

  if (images.length > 0) {
    const utapi = getUTApi()
    await utapi.deleteFiles(images.map(img => img.key))
  }

  // Delete gallery - images will be cascade deleted
  await db.delete(galleries).where(eq(galleries.id, galleryId))

  revalidatePath("/admin")
  redirect("/admin?tab=galleries&success=gallery-deleted")
}

// DJ CRUD operations
export async function getAdminDJs() {
  const djsWithEventCount = await db
    .select({
      id: djs.id,
      slug: djs.slug,
      name: djs.name,
      title: djs.title,
      specialty: djs.specialty,
      experience: djs.experience,
      performances: djs.performances,
      instagram: djs.instagram,
      soundcloud: djs.soundcloud,
      image: djs.image,
      isActive: djs.isActive,
      createdAt: djs.createdAt,
      updatedAt: djs.updatedAt,
    })
    .from(djs)
    .orderBy(djs.name)

  return djsWithEventCount
}

export async function getDJBySlug(slug: string) {
  const dj = await db
    .select()
    .from(djs)
    .where(eq(djs.slug, slug))
    .limit(1)

  if (!dj[0]) {
    return null
  }

  return dj[0]
}

export async function createDJ(formData: FormData) {
  const name = formData.get("name") as string
  const title = formData.get("title") as string
  const specialty = formData.get("specialty") as string
  const experience = formData.get("experience") as string
  const performances = formData.get("performances") as string
  const bio = formData.get("bio") as string
  const instagram = formData.get("instagram") as string
  const soundcloud = formData.get("soundcloud") as string
  const image = formData.get("image") as string
  const imageKey = formData.get("imageKey") as string
  const isActive = formData.get("isActive") === "on"

  // Parse highlights array from form
  const highlights: string[] = []
  let index = 0
  while (formData.has(`highlights[${index}]`)) {
    const highlight = formData.get(`highlights[${index}]`) as string
    if (highlight.trim()) {
      highlights.push(highlight.trim())
    }
    index++
  }

  if (!name) {
    throw new Error("DJ name is required")
  }

  const slug = generateSlug(name)

  const result = await db
    .insert(djs)
    .values({
      slug,
      name,
      title: title || null,
      specialty: specialty || null,
      experience: experience || null,
      performances: performances || null,
      bio: bio || null,
      highlights: highlights.length > 0 ? highlights : null,
      instagram: instagram || null,
      soundcloud: soundcloud || null,
      image: image || null,
      imageKey: imageKey || null,
      isActive,
    })
    .returning({ slug: djs.slug })

  revalidatePath("/admin")
  redirect(`/admin/djs/${result[0].slug}?success=dj-created`)
}

export async function updateDJ(formData: FormData) {
  const djId = parseInt(formData.get("djId") as string)
  const name = formData.get("name") as string
  const title = formData.get("title") as string
  const specialty = formData.get("specialty") as string
  const experience = formData.get("experience") as string
  const performances = formData.get("performances") as string
  const bio = formData.get("bio") as string
  const instagram = formData.get("instagram") as string
  const soundcloud = formData.get("soundcloud") as string
  const image = formData.get("image") as string
  const imageKey = formData.get("imageKey") as string
  const isActive = formData.get("isActive") === "on"

  // Parse highlights array from form
  const highlights: string[] = []
  let index = 0
  while (formData.has(`highlights[${index}]`)) {
    const highlight = formData.get(`highlights[${index}]`) as string
    if (highlight.trim()) {
      highlights.push(highlight.trim())
    }
    index++
  }

  if (!djId || !name) {
    throw new Error("Required fields missing")
  }

  // Get the current DJ to check if image is being replaced
  const currentDJ = await db
    .select({ imageKey: djs.imageKey, image: djs.image })
    .from(djs)
    .where(eq(djs.id, djId))
    .limit(1)

  // If there's an old imageKey and it's different from the new one, delete the old image
  if (currentDJ[0]?.imageKey && currentDJ[0].imageKey !== imageKey) {
    try {
      const utapi = getUTApi()
      await utapi.deleteFiles(currentDJ[0].imageKey)
      console.log(`Deleted old image ${currentDJ[0].imageKey} from UploadThing`)
    } catch (error) {
      console.error("Failed to delete old image from UploadThing:", error)
    }
  }

  const slug = generateSlug(name)

  await db
    .update(djs)
    .set({
      slug,
      name,
      title: title || null,
      specialty: specialty || null,
      experience: experience || null,
      performances: performances || null,
      bio: bio || null,
      highlights: highlights.length > 0 ? highlights : null,
      instagram: instagram || null,
      soundcloud: soundcloud || null,
      image: image || null,
      imageKey: imageKey || null,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(djs.id, djId))

  revalidatePath("/admin")
  revalidatePath(`/admin/djs/${slug}`)
  redirect(`/admin/djs/${slug}?success=dj-updated`)
}

export async function deleteDJ(formData: FormData) {
  const djId = parseInt(formData.get("djId") as string)

  if (!djId) {
    throw new Error("DJ ID is required")
  }

  // Get DJ image key for cleanup
  const djData = await db
    .select({ imageKey: djs.imageKey })
    .from(djs)
    .where(eq(djs.id, djId))
    .limit(1)

  if (djData[0]?.imageKey) {
    try {
      const utapi = getUTApi()
      await utapi.deleteFiles(djData[0].imageKey)
      console.log(`Deleted image ${djData[0].imageKey} from UploadThing`)
    } catch (error) {
      console.error("Failed to delete image from UploadThing:", error)
    }
  }

  await db.delete(djs).where(eq(djs.id, djId))

  revalidatePath("/admin")
  redirect("/admin")
}

// Get DJs for bookings page - only active DJs ordered by orderIndex
export async function getBookingsDJs() {
  const activeDJs = await db
    .select({
      id: djs.id,
      name: djs.name,
      title: djs.title,
      specialty: djs.specialty,
      experience: djs.experience,
      performances: djs.performances,
      bio: djs.bio,
      highlights: djs.highlights,
      instagram: djs.instagram,
      soundcloud: djs.soundcloud,
      image: djs.image,
    })
    .from(djs)
    .where(eq(djs.isActive, true))
    .orderBy(djs.name)

  return activeDJs
}

// Delete uploaded file(s) from UploadThing
// Used when users remove images before saving the form
export async function deleteUploadedFiles(fileKeys: string | string[]) {
  try {
    const utapi = getUTApi()
    const keys = Array.isArray(fileKeys) ? fileKeys : [fileKeys]
    await utapi.deleteFiles(keys)
    console.log(`Deleted ${keys.length} file(s) from UploadThing:`, keys)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete files from UploadThing:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
