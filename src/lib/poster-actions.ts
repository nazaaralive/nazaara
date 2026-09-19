"use server"

import { db } from "@/db/drizzle"
import { posterLinks, events } from "@/db/schema"
import { eq, desc, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Mutating actions for poster tracking links.
 *
 * SECURITY: every export here checks the session itself. Server actions are
 * independently reachable HTTP endpoints - the fact that /admin/posters is
 * gated does NOT protect them. Without this check anyone could create or
 * delete tracking links.
 */
async function requireAdmin(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    throw new Error("Not authorised")
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
}

/** Guarantees a free code, appending -2, -3 ... on collision. */
async function ensureUniqueCode(desired: string): Promise<string> {
  const base = slugify(desired) || "link"

  const rows = await db
    .select({ code: posterLinks.code })
    .from(posterLinks)
    .where(sql`${posterLinks.code} = ${base} OR ${posterLinks.code} LIKE ${base + "-%"}`)

  const taken = new Set(rows.map((r) => r.code))
  if (!taken.has(base)) return base

  for (let i = 2; i < 500; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  throw new Error("Could not generate a unique code")
}

export interface CreatePosterLinkResult {
  ok: boolean
  code?: string
  error?: string
}

export async function createPosterLink(formData: FormData): Promise<CreatePosterLinkResult> {
  await requireAdmin()

  const name = ((formData.get("name") as string) || "").trim()
  const eventSlug = ((formData.get("eventSlug") as string) || "").trim()
  const city = ((formData.get("city") as string) || "").trim() || null
  const placement = ((formData.get("placement") as string) || "").trim() || null
  const campaign = ((formData.get("campaign") as string) || "").trim() || "general"
  const customCode = ((formData.get("code") as string) || "").trim()

  if (!name) return { ok: false, error: "Give the link a name." }
  if (!eventSlug) return { ok: false, error: "Pick an event." }

  // Confirm the event exists so we never mint a link to a dead page.
  const event = await db
    .select({ slug: events.slug })
    .from(events)
    .where(eq(events.slug, eventSlug))
    .limit(1)

  if (!event[0]) return { ok: false, error: "That event no longer exists." }

  try {
    const code = await ensureUniqueCode(customCode || name)
    await db.insert(posterLinks).values({
      code,
      label: name.slice(0, 255),
      eventSlug,
      city: city?.slice(0, 100) ?? null,
      placement: placement?.slice(0, 100) ?? null,
      campaign: campaign.slice(0, 100),
    })

    revalidatePath("/admin/posters")
    return { ok: true, code }
  } catch (error) {
    console.error("createPosterLink failed:", error)
    return { ok: false, error: "Could not create the link. Please try again." }
  }
}

export async function setPosterLinkActive(id: number, isActive: boolean): Promise<void> {
  await requireAdmin()
  await db.update(posterLinks).set({ isActive }).where(eq(posterLinks.id, id))
  revalidatePath("/admin/posters")
}

/**
 * Repoint a printed poster without reprinting it. Pass null to fall back to
 * the event page.
 */
export async function updatePosterDestination(
  id: number,
  destination: string | null
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()

  const trimmed = destination?.trim() || null

  if (trimmed) {
    // Only absolute http(s) URLs - an open redirect to anything else would be
    // a gift to phishers, since these links live on our domain.
    try {
      const url = new URL(trimmed)
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { ok: false, error: "Destination must be an http or https URL." }
      }
    } catch {
      return { ok: false, error: "That does not look like a valid URL." }
    }
  }

  await db.update(posterLinks).set({ destinationOverride: trimmed }).where(eq(posterLinks.id, id))
  revalidatePath("/admin/posters")
  return { ok: true }
}

export async function deletePosterLink(id: number): Promise<void> {
  await requireAdmin()
  // poster_scans cascades - deleting a link intentionally discards its history.
  await db.delete(posterLinks).where(eq(posterLinks.id, id))
  revalidatePath("/admin/posters")
}

export interface EventOption {
  slug: string
  title: string
  startTime: Date
}

/** Events offered in the create form, most recent first. */
export async function getEventOptions(): Promise<EventOption[]> {
  const rows = await db
    .select({
      slug: events.slug,
      title: events.title,
      startTime: events.startTime,
    })
    .from(events)
    .orderBy(desc(events.startTime))

  return rows.map((r) => ({ ...r, startTime: new Date(r.startTime) }))
}
