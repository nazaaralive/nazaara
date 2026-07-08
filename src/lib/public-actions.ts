"use server"

import { db } from "@/db/drizzle"
import { events, artists, venues, eventsArtists, galleries, galleryImages, eventStops } from "@/db/schema"
import { eq, and, gte, asc, desc, sql, inArray } from "drizzle-orm"
import {
  METRO_AREAS, getRegionInfo, getMetroAnchor,
  isEventUpcoming, decodeCityName,
} from "@/lib/event-time"

export interface PublicArtist {
  name: string;
  instagram?: string | null;
  soundcloud?: string | null;
  image?: string | null;
}

export interface PublicEvent {
  id: number;
  slug: string;
  artist: string;
  artists: PublicArtist[];
  title: string;
  tagline?: string | null;
  description?: string | null;
  date: string;
  year: string;
  venue: string;
  venueDescription?: string | null;
  venueAddress?: string | null;
  venueAddressUrl?: string | null;
  venueImages?: string[] | null;
  city: string;
  country: string;
  image: string | null;
  status: string;
  isFeatured: boolean;
  isTour?: boolean;
  ticketUrl?: string | null;
  startTime: Date | string;
  endTime: Date | string;
}

export interface PublicEventStop {
  city: string;
  country: string;
  venue?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  ticketUrl?: string | null;
}

function formatDateToDisplay(date: Date): { date: string; year: string } {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString();
  return {
    date: `${day.toString().padStart(2, '0')} ${month}`,
    year
  };
}

export async function getPublicEvents(): Promise<PublicEvent[]> {
  const eventsWithDetails = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      tagline: events.tagline,
      description: events.description,
      startTime: events.startTime,
      endTime: events.endTime,
      image: events.image,
      ticketUrl: events.ticketUrl,
      venueId: events.venueId,
      isTour: events.isTour,
      venueName: venues.name,
      venueDescription: venues.description,
      venueAddress: venues.address,
      venueAddressUrl: venues.addressUrl,
      venueImages: venues.images,
      venueCity: venues.city,
      venueCountry: venues.country,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.isPublished, true))
    .orderBy(asc(events.startTime))

  // Get artists for all events
  const eventIds = eventsWithDetails.map(e => e.id);

  const eventArtists = eventIds.length > 0
    ? await db
        .select({
          eventId: eventsArtists.eventId,
          artistName: artists.name,
          artistInstagram: artists.instagram,
          artistSoundcloud: artists.soundcloud,
          artistImage: artists.image,
          orderIndex: eventsArtists.orderIndex,
        })
        .from(eventsArtists)
        .leftJoin(artists, eq(eventsArtists.artistId, artists.id))
        .orderBy(eventsArtists.orderIndex)
    : []

  // Group artists by event
  const eventIdSet = new Set(eventIds);
  const artistsByEvent = eventArtists
    .filter(row => eventIdSet.has(row.eventId))
    .reduce((acc, row) => {
      if (!acc[row.eventId]) acc[row.eventId] = []
      if (row.artistName) {
        acc[row.eventId].push({
          name: row.artistName,
          instagram: row.artistInstagram,
          soundcloud: row.artistSoundcloud,
          image: row.artistImage,
          orderIndex: row.orderIndex || 0,
        })
      }
      return acc
    }, {} as Record<number, (PublicArtist & { orderIndex: number })[]>)

  const result = eventsWithDetails.map(event => {
    const { date, year } = formatDateToDisplay(event.startTime);
    const eventArtistsList = (artistsByEvent[event.id] || [])
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(({ name, instagram, soundcloud, image }) => ({ name, instagram, soundcloud, image }));

    const primaryArtist = eventArtistsList[0]?.name || event.title;

    const isFeatured = false;

    // "Past" is judged in the EVENT CITY's local time. Stored times are
    // wall-clock values labeled as UTC (see src/lib/event-time.ts), so
    // comparing against plain new Date() would mark events past hours early.
    let status = "On Sale";
    if (!event.ticketUrl) {
      status = "Coming Soon";
    } else if (!isEventUpcoming(event.startTime, event.venueCity || undefined)) {
      status = "Past Event";
    }

    return {
      id: event.id,
      slug: event.slug,
      artist: primaryArtist,
      artists: eventArtistsList,
      title: event.title,
      tagline: event.tagline,
      description: event.description,
      date,
      year,
      venue: event.venueName || "TBA",
      venueDescription: event.venueDescription,
      venueAddress: event.venueAddress,
      venueAddressUrl: event.venueAddressUrl,
      venueImages: event.venueImages,
      city: event.venueCity || "TBA",
      country: event.venueCountry || "TBA",
      image: event.image,
      status,
      isFeatured,
      isTour: event.isTour ?? false,
      ticketUrl: event.ticketUrl,
      startTime: event.startTime,
      endTime: event.endTime,
    };
  });

  // For tour events, fetch stops to populate venue/city/country instead of "TBA"
  const tourEventIds = result.filter(e => e.isTour).map(e => e.id);
  if (tourEventIds.length > 0) {
    const allTourStops = await db
      .select({
        eventId: eventStops.eventId,
        city: eventStops.city,
        country: eventStops.country,
        venueName: venues.name,
        startTime: eventStops.startTime,
      })
      .from(eventStops)
      .leftJoin(venues, eq(eventStops.venueId, venues.id))
      .where(inArray(eventStops.eventId, tourEventIds))
      .orderBy(asc(eventStops.startTime));

    // Group stops by event
    const stopsByEvent = allTourStops.reduce((acc, s) => {
      if (!acc[s.eventId]) acc[s.eventId] = [];
      acc[s.eventId].push(s);
      return acc;
    }, {} as Record<number, typeof allTourStops>);

    // Populate tour event data from stops
    for (const event of result) {
      if (!event.isTour) continue;
      const stops = stopsByEvent[event.id] || [];
      if (stops.length > 0) {
        const firstStop = stops[0];
        const uniqueCities = [...new Set(stops.map(s => s.city))];
        // Show city names: all if ≤4, otherwise first 3 + "X more"
        if (uniqueCities.length <= 4) {
          event.city = uniqueCities.join(', ');
        } else {
          event.city = `${uniqueCities.slice(0, 3).join(', ')} + ${uniqueCities.length - 3} more`;
        }
        event.venue = "Tour";
        event.country = firstStop.country;
      } else {
        event.venue = "Tour";
        event.city = "Multiple Cities";
      }
    }
  }

  return result;
}

export async function getPublicUpcomingEvents(): Promise<PublicEvent[]> {
  const allEvents = await getPublicEvents();
  // Per-event city-local comparison (see src/lib/event-time.ts).
  return allEvents.filter(event => isEventUpcoming(event.startTime, event.city));
}

export async function getPublicFeaturedEvent(): Promise<PublicEvent | null> {
  console.log('[getPublicFeaturedEvent] Starting featured event retrieval');

  try {
    console.log('[getPublicFeaturedEvent] Fetching all public events');
    const allEvents = await getPublicEvents();
    console.log(`[getPublicFeaturedEvent] Retrieved ${allEvents.length} public events`);

    // Filter for upcoming events — judged in each event's own city timezone
    // (stored times are wall-clock labeled as UTC; see src/lib/event-time.ts).
    const upcomingEvents = allEvents.filter(event => {
      const isUpcoming = isEventUpcoming(event.startTime, event.city);
      console.log(`[getPublicFeaturedEvent] Event "${event.title}" (${event.slug}): ${new Date(event.startTime).toISOString()} (${event.city}) - Upcoming: ${isUpcoming}`);
      return isUpcoming;
    });

    console.log(`[getPublicFeaturedEvent] Found ${upcomingEvents.length} upcoming events`);

    if (upcomingEvents.length === 0) {
      console.log('[getPublicFeaturedEvent] No upcoming events found, returning null');
      return null;
    }

    // Get the earliest upcoming event
    const featuredEvent = upcomingEvents.reduce((earliest, current) => {
      const earliestDate = new Date(earliest.startTime);
      const currentDate = new Date(current.startTime);
      return currentDate < earliestDate ? current : earliest;
    });

    console.log(`[getPublicFeaturedEvent] Featured event: "${featuredEvent.title}" (${featuredEvent.slug}) on ${featuredEvent.startTime}`);
    return featuredEvent;
  } catch (error) {
    console.error('[getPublicFeaturedEvent] Error:', error);
    throw error;
  }
}

export async function getPublicEventStops(eventId: number): Promise<PublicEventStop[]> {
  const stops = await db
    .select({
      city: eventStops.city,
      country: eventStops.country,
      venueName: venues.name,
      venueDescription: venues.description,
      startTime: eventStops.startTime,
      endTime: eventStops.endTime,
      ticketUrl: eventStops.ticketUrl,
    })
    .from(eventStops)
    .leftJoin(venues, eq(eventStops.venueId, venues.id))
    .where(eq(eventStops.eventId, eventId))
    .orderBy(asc(eventStops.startTime))

  return stops.map(stop => ({
    city: stop.city,
    country: stop.country,
    venue: stop.venueName,
    startTime: stop.startTime,
    endTime: stop.endTime,
    ticketUrl: stop.ticketUrl,
  }))
}

export async function getPublicEventForCity(cityName: string): Promise<PublicEvent | null> {
  // Geo-IP cookie values arrive URL-encoded ("New%20York") — decode so
  // multi-word cities actually match instead of falling through to fallback.
  cityName = decodeCityName(cityName);
  console.log(`[getPublicEventForCity] Starting search for city: "${cityName}"`);

  try {
    // Get all public events
    console.log('[getPublicEventForCity] Fetching all public events');
    const allEvents = await getPublicEvents();
    console.log(`[getPublicEventForCity] Retrieved ${allEvents.length} public events`);

    // Filter for upcoming events — judged in each event's own city timezone
    // (stored times are wall-clock labeled as UTC; see src/lib/event-time.ts).
    const upcomingEvents = allEvents.filter(event =>
      isEventUpcoming(event.startTime, event.city)
    );

    console.log(`[getPublicEventForCity] Found ${upcomingEvents.length} upcoming events`);

    // Helper function to check if an event matches a city
    const eventMatchesCity = (event: PublicEvent, targetCity: string): boolean => {
      const eventCity = event.city?.toLowerCase() || '';
      const normalizedTarget = targetCity.toLowerCase();

      // Exact match
      if (eventCity === normalizedTarget) {
        console.log(`[getPublicEventForCity] Exact match found: "${event.city}" for "${cityName}"`);
        return true;
      }

      // Check metro area
      const metroAnchor = getMetroAnchor(targetCity);
      if (metroAnchor) {
        const metroMembers = METRO_AREAS[metroAnchor] || [];
        const eventCityInMetro = metroMembers.some(m => m.toLowerCase() === eventCity);
        if (eventCityInMetro) {
          console.log(`[getPublicEventForCity] Metro match: "${event.city}" in metro area "${metroAnchor}" (searching for "${cityName}")`);
          return true;
        }
      }

      return false;
    };

    // First pass: exact city match
    console.log(`[getPublicEventForCity] Looking for exact city match: "${cityName}"`);
    let matchedEvent = upcomingEvents.find(event => eventMatchesCity(event, cityName));

    if (matchedEvent) {
      console.log(`[getPublicEventForCity] Found exact match: "${matchedEvent.title}" in ${matchedEvent.city}`);
      return matchedEvent;
    }

    console.log(`[getPublicEventForCity] No exact city match found for "${cityName}"`);

    // Second pass: regional fallback
    const regionInfo = getRegionInfo(cityName);
    if (regionInfo) {
      console.log(`[getPublicEventForCity] Attempting regional fallback for "${cityName}" (${regionInfo.region}, ${regionInfo.country})`);

      const regionEvents = upcomingEvents.filter(event => {
        const eventRegionInfo = getRegionInfo(event.city);
        const isInRegion = eventRegionInfo?.region === regionInfo.region && eventRegionInfo?.country === regionInfo.country;
        if (isInRegion) {
          console.log(`[getPublicEventForCity] Regional match found: "${event.title}" in ${event.city} (${event.country})`);
        }
        return isInRegion;
      });

      if (regionEvents.length > 0) {
        // Return the earliest event in the region
        matchedEvent = regionEvents.reduce((earliest, current) => {
          const earliestDate = new Date(earliest.startTime);
          const currentDate = new Date(current.startTime);
          return currentDate < earliestDate ? current : earliest;
        });

        console.log(`[getPublicEventForCity] Returning earliest regional event: "${matchedEvent.title}" in ${matchedEvent.city}`);
        return matchedEvent;
      }

      console.log(`[getPublicEventForCity] No events found in region: ${regionInfo.region}`);
    } else {
      console.log(`[getPublicEventForCity] City "${cityName}" not found in REGIONS mapping`);
    }

    // Third pass: return any upcoming event as fallback
    if (upcomingEvents.length > 0) {
      const fallbackEvent = upcomingEvents[0];
      console.log(`[getPublicEventForCity] Using fallback: returning first upcoming event "${fallbackEvent.title}" in ${fallbackEvent.city}`);
      return fallbackEvent;
    }

    console.log(`[getPublicEventForCity] No events found (exact match, regional, or fallback)`);
    return null;
  } catch (error) {
    console.error(`[getPublicEventForCity] Error searching for city "${cityName}":`, error);
    throw error;
  }
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent | null> {
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
      ticketUrl: events.ticketUrl,
      venueId: events.venueId,
      isTour: events.isTour,
      venueName: venues.name,
      venueDescription: venues.description,
      venueAddress: venues.address,
      venueAddressUrl: venues.addressUrl,
      venueImages: venues.images,
      venueCity: venues.city,
      venueCountry: venues.country,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(eq(events.slug, slug), eq(events.isPublished, true)))
    .limit(1)

  if (!eventWithDetails.length) {
    return null;
  }

  const event = eventWithDetails[0];

  // Get artists
  const eventArtists = await db
    .select({
      artistName: artists.name,
      artistInstagram: artists.instagram,
      artistSoundcloud: artists.soundcloud,
      artistImage: artists.image,
      orderIndex: eventsArtists.orderIndex,
    })
    .from(eventsArtists)
    .leftJoin(artists, eq(eventsArtists.artistId, artists.id))
    .where(eq(eventsArtists.eventId, event.id))
    .orderBy(eventsArtists.orderIndex)

  const eventArtistsList = eventArtists
    .filter(row => row.artistName)
    .map(({ artistName, artistInstagram, artistSoundcloud, artistImage }) => ({
      name: artistName!,
      instagram: artistInstagram,
      soundcloud: artistSoundcloud,
      image: artistImage,
    }));

  const primaryArtist = eventArtistsList[0]?.name || event.title;

  const { date, year } = formatDateToDisplay(event.startTime);

  // "Past" is judged in the event city's local time (see src/lib/event-time.ts).
  let status = "On Sale";
  if (!event.ticketUrl) {
    status = "Coming Soon";
  } else if (!isEventUpcoming(event.startTime, event.venueCity || undefined)) {
    status = "Past Event";
  }

  return {
    id: event.id,
    slug: event.slug,
    artist: primaryArtist,
    artists: eventArtistsList,
    title: event.title,
    tagline: event.tagline,
    description: event.description,
    date,
    year,
    venue: event.venueName || "TBA",
    venueDescription: event.venueDescription,
    venueAddress: event.venueAddress,
    venueAddressUrl: event.venueAddressUrl,
    venueImages: event.venueImages,
    city: event.venueCity || "TBA",
    country: event.venueCountry || "TBA",
    image: event.image,
    status,
    isFeatured: false,
    isTour: event.isTour ?? false,
    ticketUrl: event.ticketUrl,
    startTime: event.startTime,
    endTime: event.endTime,
  };
}

// Gallery Types
export interface PublicGalleryImage {
  id: number;
  url: string;
  caption?: string | null;
  orderIndex: number | null;
}

export interface PublicGallery {
  id: number;
  slug: string;
  title: string;
  description?: string | null;
  date: Date;
  coverImage?: string | null;
  imageCount: number;
  firstImage?: string | null;
  images?: PublicGalleryImage[];
}

// Get all public galleries
export async function getPublicGalleries(): Promise<PublicGallery[]> {
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

  return galleriesWithImageCount.map(gallery => ({
    id: gallery.id,
    slug: gallery.slug,
    title: gallery.title,
    description: gallery.description,
    date: gallery.date,
    coverImage: gallery.coverImage,
    imageCount: Number(gallery.imageCount),
    firstImage: gallery.firstImage,
  }));
}

// Get single gallery by slug with all images
export async function getPublicGalleryBySlug(slug: string): Promise<PublicGallery | null> {
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
      caption: galleryImages.caption,
      orderIndex: galleryImages.orderIndex,
    })
    .from(galleryImages)
    .where(eq(galleryImages.galleryId, gallery[0].id))
    .orderBy(galleryImages.orderIndex)

  return {
    id: gallery[0].id,
    slug: gallery[0].slug,
    title: gallery[0].title,
    description: gallery[0].description,
    date: gallery[0].date,
    coverImage: gallery[0].coverImage,
    imageCount: images.length,
    firstImage: images[0]?.url || gallery[0].coverImage,
    images: images.map(img => ({
      id: img.id,
      url: img.url,
      caption: img.caption,
      orderIndex: img.orderIndex,
    })),
  };
}
