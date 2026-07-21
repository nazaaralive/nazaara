/**
 * Database Schema for Nazaara Live Events Platform
 * 
 * This schema defines the core data structures for managing events, venues, and artists
 * for the Nazaara Live music and events company. The design prioritizes:
 * - Data normalization to prevent duplication
 * - Efficient querying with strategic indexes  
 * - Proper relationships between entities
 * - Scalability for future growth
 */

import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  boolean,
  timestamp, 
  integer,
  primaryKey,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * VENUES TABLE
 * 
 * Stores information about event venues. Venues are normalized into their own table
 * since the same venue (e.g., Fortune Sound Club) hosts multiple events.
 * This prevents data duplication and ensures consistency.
 */
export const venues = pgTable("venues", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // URL-friendly identifier
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g., "fortune-sound-club"
  
  // Basic venue information
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Fortune Sound Club"
  description: text("description"), // Two-sentence venue description for marketing
  
  // Location details
  address: text("address"), // Full physical address
  addressUrl: text("address_url"), // Google Maps or directions URL
  city: varchar("city", { length: 100 }).notNull(), // e.g., "Vancouver"
  country: varchar("country", { length: 100 }).notNull(), // e.g., "Canada"
  
  // Media assets
  images: text("images").array(), // Array of venue image URLs for showcasing
  imageKeys: text("image_keys").array(), // Array of UploadThing file keys for deletion management
  
  // Audit timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexes for common query patterns
    slugIdx: index("venue_slug_idx").on(table.slug), // Route lookup by slug
    nameIdx: index("venue_name_idx").on(table.name), // Search by venue name
    cityIdx: index("venue_city_idx").on(table.city), // Filter events by city
  };
});

/**
 * ARTISTS TABLE
 * 
 * Stores artist profiles and social media links. Artists are normalized to avoid
 * duplication when the same artist performs at multiple events (e.g., Shalv appears
 * in multiple lineups). The unique constraint on name prevents duplicate entries.
 */
export const artists = pgTable("artists", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // URL-friendly identifier
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g., "yasmina", "aj-wavy"
  
  // Artist identity - unique constraint prevents duplicates
  name: varchar("name", { length: 255 }).notNull().unique(), // e.g., "Yasmina", "AJ WAVY"
  
  // Social media presence
  instagram: varchar("instagram", { length: 100 }), // Instagram handle (without @)
  soundcloud: varchar("soundcloud", { length: 100 }), // SoundCloud username
  
  // Media assets
  image: text("image"), // Artist profile image URL

  // Alumni wall — manual toggle from the admin artists grid.
  // Column added manually in Neon on 2026-07-20 (ALTER TABLE artists
  // ADD COLUMN is_alumni boolean NOT NULL DEFAULT false); kept in sync
  // here so future drizzle-kit push/generate runs see the same shape.
  isAlumni: boolean("is_alumni").default(false).notNull(),

  // Audit timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Index for artist search and lookup
    slugIdx: index("artist_slug_idx").on(table.slug), // Route lookup by slug
    nameIdx: index("artist_name_idx").on(table.name),
  };
});

/**
 * EVENTS TABLE
 * 
 * Core events table storing all event information. Each event references a venue
 * through a foreign key relationship. Artist lineups are handled through the
 * junction table to support multiple artists per event.
 */
export const events = pgTable("events", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // Event identity and routing
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly identifier
  
  // Event branding and content
  title: varchar("title", { length: 255 }).notNull(), // e.g., "NAZAARA", "Back 2 School with AJ Wavy"
  tagline: varchar("tagline", { length: 255 }), // e.g., "Live In Vancouver", "An All White Retro Affair"
  description: text("description"), // Full marketing description with formatting
  
  // Date and time information
  startTime: timestamp("start_time").notNull(), // Event start date and time
  endTime: timestamp("end_time").notNull(), // Event end date and time
  
  // Venue relationship
  // Foreign key to venues table - ensures referential integrity
  // When venue is deleted, this field is set to null
  venueId: integer("venue_id").references(() => venues.id, { onDelete: "set null" }),
  
  // Media and external links
  image: text("image"), // Event poster/promotional image URL from UploadThing
  imageKey: text("image_key"), // UploadThing file key for deletion management
  ticketUrl: text("ticket_url"), // External ticket purchasing link
  
  // Tour support
  isTour: boolean("is_tour").default(false).notNull(), // Whether this event represents a tour with multiple stops
  
  // Publishing status
  isPublished: boolean("is_published").default(false).notNull(), // Whether event is visible to public
  
  // Audit timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Strategic indexes for common query patterns
    slugIdx: index("event_slug_idx").on(table.slug), // Route lookup by slug
    startTimeIdx: index("event_start_time_idx").on(table.startTime), // Sort by date, filter upcoming
  };
});

/**
 * EVENTS_ARTISTS JUNCTION TABLE
 * 
 * Manages the many-to-many relationship between events and artists.
 * Each event can have multiple artists, and each artist can perform at multiple events.
 * 
 * The orderIndex field maintains the lineup order for proper display
 * (e.g., headliner first, supporting acts in specific sequence).
 * 
 * Cascade deletes ensure data integrity - if an event or artist is deleted,
 * the corresponding junction records are automatically removed.
 */
export const eventsArtists = pgTable("events_artists", {
  // Foreign key relationships with cascade delete
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  artistId: integer("artist_id").references(() => artists.id, { onDelete: "cascade" }).notNull(),
  
  // Lineup ordering - 0 for headliner, 1+ for supporting acts
  orderIndex: integer("order_index").default(0), 
  
  // Creation timestamp for audit trail
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Composite primary key prevents duplicate artist-event pairs
  pk: primaryKey({ columns: [table.eventId, table.artistId] }),
  
  // Indexes for efficient relationship queries
  eventIdx: index("events_artists_event_idx").on(table.eventId), // Find artists for an event
  artistIdx: index("events_artists_artist_idx").on(table.artistId), // Find events for an artist
}));

/**
 * EVENT_STOPS TABLE
 * 
 * Stores per-stop data for tour events. Each stop can optionally reference a venue
 * or just provide city/country for TBA locations. Ordering is controlled via
 * orderIndex to allow explicit sequencing across stops.
 */
export const eventStops = pgTable("event_stops", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // Foreign key to events - cascade delete removes stops when event deleted
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  
  // Location details (optional venue, but city/country required for display)
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  venueId: integer("venue_id").references(() => venues.id, { onDelete: "set null" }),
  
  // Date and time for the specific stop
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  
  // Optional per-stop ticket URL
  ticketUrl: text("ticket_url"),
  
  // Display ordering across stops (0 = first)
  orderIndex: integer("order_index").default(0),
  
  // Audit timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for efficient queries and ordering
  eventIdx: index("event_stops_event_idx").on(table.eventId),
  startTimeIdx: index("event_stops_start_time_idx").on(table.startTime),
  cityIdx: index("event_stops_city_idx").on(table.city),
}));

/**
 * GALLERIES TABLE
 * 
 * Stores gallery information for photo collections. Each gallery can contain
 * multiple images stored in the galleryImages table. This normalized structure
 * allows for flexible image management and future metadata additions.
 */
export const galleries = pgTable("galleries", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // URL-friendly identifier
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  
  // Gallery information
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"), // Optional gallery description
  date: timestamp("date").notNull(), // Gallery date (when photos were taken)

  // City tag shown on album cards (so the city doesn't need to live in the
  // title). Column added manually in Neon on 2026-07-20 (ALTER TABLE
  // galleries ADD COLUMN city varchar(100)); kept in sync here.
  city: varchar("city", { length: 100 }),
  
  // Optional designated cover image (URL) - if not set, use first image
  coverImage: text("cover_image"),
  
  // Audit timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexes for common query patterns
    slugIdx: index("gallery_slug_idx").on(table.slug),
    dateIdx: index("gallery_date_idx").on(table.date), // For chronological sorting
  };
});

/**
 * GALLERY_IMAGES TABLE
 * 
 * Stores individual images within galleries. This one-to-many relationship
 * allows unlimited images per gallery with individual management capabilities.
 * Images are ordered by orderIndex for display sequencing.
 */
export const galleryImages = pgTable("gallery_images", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // Foreign key to galleries table - cascade delete removes images when gallery deleted
  galleryId: integer("gallery_id").references(() => galleries.id, { onDelete: "cascade" }).notNull(),
  
  // Image data
  url: text("url").notNull(), // UploadThing URL for the image
  key: text("key").notNull(), // UploadThing key for deletion management
  
  // Optional metadata
  caption: text("caption"), // Optional image caption for future use
  
  // Display order within the gallery (0 = first)
  orderIndex: integer("order_index").default(0),
  
  // Audit timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexes for efficient queries
    galleryIdx: index("gallery_images_gallery_idx").on(table.galleryId),
    orderIdx: index("gallery_images_order_idx").on(table.orderIndex),
  };
});

/**
 * DRIZZLE ORM RELATIONS
 * 
 * These relations define how Drizzle ORM should handle joins and queries
 * between related tables. They enable type-safe querying with automatic
 * joins and proper TypeScript inference.
 */

// Venues can have many events
export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

// Artists can perform at many events (through junction table)
export const artistsRelations = relations(artists, ({ many }) => ({
  eventsArtists: many(eventsArtists),
}));

// Events belong to one venue and can have many artists
export const eventsRelations = relations(events, ({ one, many }) => ({
  // One-to-one relationship with venue
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  // One-to-many relationship with junction table
  eventsArtists: many(eventsArtists),
  // One-to-many relationship with tour stops
  eventStops: many(eventStops),
}));

// Junction table relations to both events and artists
export const eventsArtistsRelations = relations(eventsArtists, ({ one }) => ({
  // Each junction record belongs to one event
  event: one(events, {
    fields: [eventsArtists.eventId],
    references: [events.id],
  }),
  // Each junction record belongs to one artist
  artist: one(artists, {
    fields: [eventsArtists.artistId],
    references: [artists.id],
  }),
}));

// Event stops belong to one event and optionally to one venue
export const eventStopsRelations = relations(eventStops, ({ one }) => ({
  event: one(events, {
    fields: [eventStops.eventId],
    references: [events.id],
  }),
  venue: one(venues, {
    fields: [eventStops.venueId],
    references: [venues.id],
  }),
}));

// Galleries can have many images
export const galleriesRelations = relations(galleries, ({ many }) => ({
  images: many(galleryImages),
}));

// Gallery images belong to one gallery
export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  gallery: one(galleries, {
    fields: [galleryImages.galleryId],
    references: [galleries.id],
  }),
}));

/**
 * DJS TABLE
 * 
 * Stores internal DJ profiles for the bookings page. These are Nazaara's
 * own roster of DJs that are featured on the bookings page for private events.
 * Separate from the general artists table to allow for different fields and
 * management workflows specific to internal roster management.
 */
export const djs = pgTable("djs", {
  // Primary identifier
  id: serial("id").primaryKey(),
  
  // URL-friendly identifier
  slug: varchar("slug", { length: 255 }).notNull().unique(), // e.g., "dj-rishi", "dj-priya"
  
  // Basic DJ identity - unique constraint prevents duplicates
  name: varchar("name", { length: 255 }).notNull().unique(), // e.g., "DJ RISHI", "DJ PRIYA"
  
  // DJ-specific branding
  title: varchar("title", { length: 255 }), // e.g., "The Maestro", "The Innovator"
  specialty: varchar("specialty", { length: 255 }), // e.g., "Bollywood & House Fusion"
  experience: varchar("experience", { length: 100 }), // e.g., "15+ Years"
  performances: varchar("performances", { length: 100 }), // e.g., "500+ Events"
  
  // Detailed information
  bio: text("bio"), // Long-form biography for expanded view
  highlights: text("highlights").array(), // Array of career highlights
  
  // Social media presence
  instagram: varchar("instagram", { length: 100 }), // Instagram handle (without @)
  soundcloud: varchar("soundcloud", { length: 100 }), // SoundCloud username
  
  // Media assets
  image: text("image"), // DJ profile image URL from UploadThing
  imageKey: text("image_key"), // UploadThing file key for deletion management
  
  // Management fields
  isActive: boolean("is_active").default(true).notNull(), // Whether DJ is shown on bookings page
  
  // Audit timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Indexes for common query patterns
    slugIdx: index("dj_slug_idx").on(table.slug), // Route lookup by slug
    nameIdx: index("dj_name_idx").on(table.name), // Search by DJ name
    activeIdx: index("dj_active_idx").on(table.isActive), // Filter active DJs
  };
});

// DJs table relations (standalone table, no relations needed initially)
export const djsRelations = relations(djs, ({ }) => ({
  // No relations initially - standalone table for internal roster
}));

/**
 * SITE_SETTINGS TABLE
 * 
 * Stores global site configuration settings. Uses a singleton pattern with
 * a single row (id=1) that gets updated. This replaces the JSON file approach
 * which doesn't work in read-only serverless environments like Vercel.
 */
export const siteSettings = pgTable("site_settings", {
  // Fixed ID of 1 - only one settings row exists
  id: serial("id").primaryKey(),
  
  // Page visibility toggles
  hideAbout: boolean("hide_about").default(false).notNull(),
  hideBookings: boolean("hide_bookings").default(false).notNull(),
  
  // Gallery configuration
  useExternalGallery: boolean("use_external_gallery").default(false).notNull(),
  externalGalleryUrl: text("external_gallery_url").default("https://tamasha.myportfolio.com/").notNull(),
  
  // Audit timestamps
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});