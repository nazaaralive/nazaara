"use server"

import { db } from "@/db/drizzle"
import { events, venues, eventFeedback } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

/**
 * Event details shown in the header of the public feedback form.
 * Deliberately does NOT filter on isPublished or startTime — feedback is
 * collected after the event, often once it has already been unpublished.
 */
export interface FeedbackEvent {
  id: number
  slug: string
  title: string
  tagline: string | null
  startTime: Date
  image: string | null
  venueName: string | null
  venueCity: string | null
}

export async function getFeedbackEvent(slug: string): Promise<FeedbackEvent | null> {
  const rows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      tagline: events.tagline,
      startTime: events.startTime,
      image: events.image,
      venueName: venues.name,
      venueCity: venues.city,
    })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.slug, slug))
    .limit(1)

  return rows[0] ?? null
}

/** Parse an integer field, returning null unless it lands inside [min, max]. */
function parseScore(value: FormDataEntryValue | null, min: number, max: number): number | null {
  if (value === null || value === "") return null
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) return null
  return n
}

/** Trim to a max length, collapsing empty strings to null. */
function parseText(value: FormDataEntryValue | null, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export interface SubmitFeedbackResult {
  ok: boolean
  error?: string
}

/**
 * Public, unauthenticated feedback submission.
 *
 * Hardening notes: the endpoint is open by necessity (attendees have no
 * account), so it validates every field server-side rather than trusting the
 * form, ignores unknown fields, caps text lengths, and silently discards
 * submissions that fill the hidden honeypot input.
 */
export async function submitEventFeedback(formData: FormData): Promise<SubmitFeedbackResult> {
  // Honeypot — real users never see this field, bots fill everything.
  // Return ok so the bot gets no signal that it was rejected.
  if (parseText(formData.get("company"), 100)) {
    return { ok: true }
  }

  const slug = parseText(formData.get("slug"), 255)
  if (!slug) return { ok: false, error: "Missing event." }

  const event = await getFeedbackEvent(slug)
  if (!event) return { ok: false, error: "We could not find that event." }

  const overallRating = parseScore(formData.get("overallRating"), 1, 5)
  if (overallRating === null) {
    return { ok: false, error: "Please give an overall rating." }
  }

  const wouldReturnRaw = formData.get("wouldReturn")
  const wouldReturn =
    wouldReturnRaw === "yes" ? true : wouldReturnRaw === "no" ? false : null

  const email = parseText(formData.get("email"), 320)
  // Deliberately loose: a wrong-but-plausible address is better than rejecting
  // a valid unusual one and losing the whole submission.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address does not look right." }
  }

  try {
    await db.insert(eventFeedback).values({
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,

      overallRating,

      musicRating: parseScore(formData.get("musicRating"), 1, 5),
      venueRating: parseScore(formData.get("venueRating"), 1, 5),
      soundRating: parseScore(formData.get("soundRating"), 1, 5),
      crowdRating: parseScore(formData.get("crowdRating"), 1, 5),
      valueRating: parseScore(formData.get("valueRating"), 1, 5),

      npsScore: parseScore(formData.get("npsScore"), 0, 10),
      wouldReturn,

      highlight: parseText(formData.get("highlight"), 2000),
      improvement: parseText(formData.get("improvement"), 2000),

      email,
      heardFrom: parseText(formData.get("heardFrom"), 100),
    })
  } catch (error) {
    console.error("submitEventFeedback failed:", error)
    return { ok: false, error: "Something went wrong saving your feedback. Please try again." }
  }

  revalidatePath("/admin/feedback")
  revalidatePath(`/admin/feedback/${event.slug}`)
  return { ok: true }
}

/* ---------------------------------------------------------------------------
 * Admin reads
 * ------------------------------------------------------------------------ */

export interface FeedbackSummary {
  eventSlug: string
  eventTitle: string
  responses: number
  avgOverall: number | null
  avgNps: number | null
  lastResponseAt: Date | null
}

/**
 * One row per event that has at least one response, newest activity first.
 * Grouped on the snapshotted slug/title so purged events still appear.
 */
export async function getFeedbackSummaries(): Promise<FeedbackSummary[]> {
  const rows = await db
    .select({
      eventSlug: eventFeedback.eventSlug,
      eventTitle: eventFeedback.eventTitle,
      responses: sql<number>`COUNT(*)::int`.as("responses"),
      avgOverall: sql<number | null>`AVG(${eventFeedback.overallRating})`.as("avg_overall"),
      avgNps: sql<number | null>`AVG(${eventFeedback.npsScore})`.as("avg_nps"),
      lastResponseAt: sql<Date | null>`MAX(${eventFeedback.createdAt})`.as("last_response_at"),
    })
    .from(eventFeedback)
    .groupBy(eventFeedback.eventSlug, eventFeedback.eventTitle)
    .orderBy(sql`MAX(${eventFeedback.createdAt}) DESC`)

  return rows.map((r) => ({
    ...r,
    avgOverall: r.avgOverall === null ? null : Number(r.avgOverall),
    avgNps: r.avgNps === null ? null : Number(r.avgNps),
    lastResponseAt: r.lastResponseAt ? new Date(r.lastResponseAt) : null,
  }))
}

export interface FeedbackHubRow {
  eventId: number | null
  slug: string
  title: string
  startTime: Date | null
  responses: number
  avgOverall: number | null
  /** True when the event row itself is gone (auto-purged after 100 days). */
  eventPurged: boolean
}

/**
 * Admin hub: every event with its response count, newest first, so the team can
 * grab a feedback link before an event and read responses after it.
 *
 * Events purged by cleanupExpiredEvents() that still have feedback are appended
 * at the end rather than dropped — their responses are still worth reading.
 */
export async function getFeedbackHub(): Promise<FeedbackHubRow[]> {
  const [eventRows, summaries] = await Promise.all([
    db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startTime: events.startTime,
      })
      .from(events)
      .orderBy(desc(events.startTime)),
    getFeedbackSummaries(),
  ])

  const bySlug = new Map(summaries.map((s) => [s.eventSlug, s]))

  const rows: FeedbackHubRow[] = eventRows.map((e) => {
    const s = bySlug.get(e.slug)
    bySlug.delete(e.slug)
    return {
      eventId: e.id,
      slug: e.slug,
      title: e.title,
      startTime: e.startTime,
      responses: s?.responses ?? 0,
      avgOverall: s?.avgOverall ?? null,
      eventPurged: false,
    }
  })

  // Anything left in the map belongs to an event that no longer exists.
  for (const s of bySlug.values()) {
    rows.push({
      eventId: null,
      slug: s.eventSlug,
      title: s.eventTitle,
      startTime: null,
      responses: s.responses,
      avgOverall: s.avgOverall,
      eventPurged: true,
    })
  }

  return rows
}

export interface FeedbackResponse {
  id: number
  overallRating: number
  musicRating: number | null
  venueRating: number | null
  soundRating: number | null
  crowdRating: number | null
  valueRating: number | null
  npsScore: number | null
  wouldReturn: boolean | null
  highlight: string | null
  improvement: string | null
  email: string | null
  heardFrom: string | null
  createdAt: Date
}

export interface EventFeedbackDetail {
  eventSlug: string
  eventTitle: string
  responses: FeedbackResponse[]
  averages: {
    overall: number | null
    music: number | null
    venue: number | null
    sound: number | null
    crowd: number | null
    value: number | null
    nps: number | null
  }
  wouldReturnYes: number
  wouldReturnNo: number
  emailsCollected: number
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null)
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export async function getEventFeedbackDetail(slug: string): Promise<EventFeedbackDetail | null> {
  const rows = await db
    .select({
      id: eventFeedback.id,
      eventSlug: eventFeedback.eventSlug,
      eventTitle: eventFeedback.eventTitle,
      overallRating: eventFeedback.overallRating,
      musicRating: eventFeedback.musicRating,
      venueRating: eventFeedback.venueRating,
      soundRating: eventFeedback.soundRating,
      crowdRating: eventFeedback.crowdRating,
      valueRating: eventFeedback.valueRating,
      npsScore: eventFeedback.npsScore,
      wouldReturn: eventFeedback.wouldReturn,
      highlight: eventFeedback.highlight,
      improvement: eventFeedback.improvement,
      email: eventFeedback.email,
      heardFrom: eventFeedback.heardFrom,
      createdAt: eventFeedback.createdAt,
    })
    .from(eventFeedback)
    .where(eq(eventFeedback.eventSlug, slug))
    .orderBy(desc(eventFeedback.createdAt))

  if (rows.length === 0) return null

  const responses: FeedbackResponse[] = rows.map(({ eventSlug, eventTitle, ...rest }) => rest)

  return {
    eventSlug: rows[0].eventSlug,
    eventTitle: rows[0].eventTitle,
    responses,
    averages: {
      overall: average(responses.map((r) => r.overallRating)),
      music: average(responses.map((r) => r.musicRating)),
      venue: average(responses.map((r) => r.venueRating)),
      sound: average(responses.map((r) => r.soundRating)),
      crowd: average(responses.map((r) => r.crowdRating)),
      value: average(responses.map((r) => r.valueRating)),
      nps: average(responses.map((r) => r.npsScore)),
    },
    wouldReturnYes: responses.filter((r) => r.wouldReturn === true).length,
    wouldReturnNo: responses.filter((r) => r.wouldReturn === false).length,
    emailsCollected: responses.filter((r) => !!r.email).length,
  }
}
