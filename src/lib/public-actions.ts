"use server"

import { db } from "@/db/drizzle"
import { events, artists, venues, eventsArtists, galleries, galleryImages, eventStops } from "@/db/schema"
import { eq, and, gte, asc, desc, sql, inArray } from "drizzle-orm"

// Regional groupings for smart geographical fallback
const REGIONS = {
  // Canada
  'Vancouver': { country: 'Canada', region: 'Western Canada' },
  'Surrey': { country: 'Canada', region: 'Western Canada' },
  'Burnaby': { country: 'Canada', region: 'Western Canada' },
  'Richmond': { country: 'Canada', region: 'Western Canada' },
  'Calgary': { country: 'Canada', region: 'Western Canada' },
  'Edmonton': { country: 'Canada', region: 'Western Canada' },
  'Toronto': { country: 'Canada', region: 'Eastern Canada' },
  'Ottawa': { country: 'Canada', region: 'Eastern Canada' },
  'Montreal': { country: 'Canada', region: 'Eastern Canada' },
  // USA
  'New York': { country: 'United States', region: 'East Coast' },
  'Boston': { country: 'United States', region: 'East Coast' },
  'Philadelphia': { country: 'United States', region: 'East Coast' },
  'Washington': { country: 'United States', region: 'East Coast' },
  'San Francisco': { country: 'United States', region: 'West Coast' },
  'Los Angeles': { country: 'United States', region: 'West Coast' },
  'Seattle': { country: 'United States', region: 'West Coast' },
  'Portland': { country: 'United States', region: 'West Coast' },
  'Chicago': { country: 'United States', region: 'Midwest' },
  'Detroit': { country: 'United States', region: 'Midwest' },
  'Dallas': { country: 'United States', region: 'South' },
  'Houston': { country: 'United States', region: 'South' },
  'Atlanta': { country: 'United States', region: 'South' },
  // UK
  'London': { country: 'United Kingdom', region: 'UK' },
  'Manchester': { country: 'United Kingdom', region: 'UK' },
  'Birmingham': { country: 'United Kingdom', region: 'UK' },
} as const;

function getRegionInfo(city: string) {
  return REGIONS[city as keyof typeof REGIONS];
}

// Metro area groupings (priority over regions)
const METRO_AREAS: Record<string, string[]> = {
  // Canada
  Vancouver: [
    "Vancouver", "Surrey", "Burnaby", "Richmond", "North Vancouver",
    "West Vancouver", "Coquitlam", "Port Coquitlam", "Port Moody",
    "Delta", "Langley", "White Rock", "New Westminster"
  ],
  Calgary: ["Calgary", "Airdrie", "Chestermere", "Okotoks"],
  Toronto: [
    "Toronto", "Mississauga", "Brampton", "Vaughan", "Markham",
    "Richmond Hill", "Oakville", "Burlington", "Milton", "Pickering",
    "Ajax", "Whitby"
  ],
  // USA
  "New York": [
    "New York", "Manhattan", "Brooklyn", "Queens", "Bronx",
    "Staten Island", "Jersey City", "Hoboken", "Newark"
  ],
  Boston: ["Boston", "Cambridge", "Somerville", "Brookline"],
  Miami: ["Miami", "Miami Beach", "Doral", "Hialeah", "Coral Gables"],
};

function getMetroAnchor(city?: string): string | undefined {
  if (!city) return undefined;
  const entries = Object.entries(METRO_AREAS);
  for (const [anchor, members] of entries) {
    if (members.some(m => m.toLowerCase() === city.toLowerCase())) return anchor;
  }
  return undefined;
}

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

    const now = new Date();
    const isFeatured = false;

    let status = "On Sale";
    if (!event.ticketUrl) {
      status = "Coming Soon";
    } else if (event.startTime < now) {
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
  const now = new Date();
  return allEvents.filter(event => event.startTime > now);
}

export async function getPublicFeaturedEvent(): Promise<PublicEvent | null> {
  console.log('[getPublicFeaturedEvent] Starting featured event retrieval');

  try {
    console.log('[getPublicFeaturedEvent] Fetching all public events');
    const allEvents = await getPublicEvents();
    console.log(`[getPublicFeaturedEvent] Retrieved ${allEvents.length} public events`);

    const now = new Date();
    console.log(`[getPublicFeaturedEvent] Current time: ${now.toISOString()}`);

    // Filter for upcoming events
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const isUpcoming = eventDate > now;
      console.log(`[getPublicFeaturedEvent] Event "${event.title}" (${event.slug}): ${eventDate.toISOString()} - Upcoming: ${isUpcoming}`);
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
  console.log(`[getPublicEventForCity] Starting search for city: "${cityName}"`);

  try {
    // Get all public events
    console.log('[getPublicEventForCity] Fetching all public events');
    const allEvents = await getPublicEvents();
    console.log(`[getPublicEventForCity] Retrieved ${allEvents.length} public events`);

    const now = new Date();
    console.log(`[getPublicEventForCity] Current date: ${now.toISOString()}`);

    // Filter for upcoming events
    const upcomingEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate > now;
    });

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

  const now = new Date();
  let status = "On Sale";
  if (!event.ticketUrl) {
    status = "Coming Soon";
  } else if (event.startTime < now) {
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

export async function getPublicGalleries(): Promise<any[]> {
  const galleriesWithImages = await db
    .select({
      id: galleries.id,
      slug: galleries.slug,
      title: galleries.title,
      description: galleries.description,
      coverImage: galleries.coverImage,
      imageId: galleryImages.id,
      imagePath: galleryImages.imagePath,
      imageAlt: galleryImages.alt,
    })
    .from(galleries)
    .leftJoin(galleryImages, eq(galleries.id, galleryImages.galleryId))
    .where(eq(galleries.isPublished, true))
    .orderBy(asc(galleries.createdAt), asc(galleryImages.orderIndex))

  // Group images by gallery
  const galleriesMap = new Map<number, any>();

  for (const row of galleriesWithImages) {
    if (!galleriesMap.has(row.id)) {
      galleriesMap.set(row.id, {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        coverImage: row.coverImage,
        images: [],
      });
    }

    if (row.imageId) {
      galleriesMap.get(row.id)!.images.push({
        id: row.imageId,
        path: row.imagePath,
        alt: row.imageAlt,
      });
    }
  }

  return Array.from(galleriesMap.values());
}

export async function getPublicGalleryBySlug(slug: string): Promise<any | null> {
  const galleryWithImages = await db
    .select({
      id: galleries.id,
      slug: galleries.slug,
      title: galleries.title,
      description: galleries.description,
      coverImage: galleries.coverImage,
      imageId: galleryImages.id,
      imagePath: galleryImages.imagePath,
      imageAlt: galleryImages.alt,
    })
    .from(galleries)
    .leftJoin(galleryImages, eq(galleries.id, galleryImages.galleryId))
    .where(and(eq(galleries.slug, slug), eq(galleries.isPublished, true)))
    .orderBy(asc(galleryImages.orderIndex))

  if (!galleryWithImages.length) {
    return null;
  }

  const firstRow = galleryWithImages[0];

  return {
    id: firstRow.id,
    slug: firstRow.slug,
    title: firstRow.title,
    description: firstRow.description,
    coverImage: firstRow.coverImage,
    images: galleryWithImages
      .filter(row => row.imageId)
      .map(row => ({
        id: row.imageId,
        path: row.imagePath,
        alt: row.imageAlt,
      })),
  };
}
